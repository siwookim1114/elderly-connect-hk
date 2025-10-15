from typing import Dict, Any, List, Optional, Union
import json
import re
from json import JSONDecodeError, JSONDecoder
from langchain_ollama import ChatOllama
from langchain.tools import tool, BaseTool
from langchain.prompts import PromptTemplate
from langchain.agents import AgentExecutor, create_react_agent
from bson.objectid import ObjectId
from langchain import hub

# Utils
from agents.utils.callback_handler import PrintCallbackHandler
from agents.utils.conversation_buffer_safe import SafeConversationMemory
from agents.utils.mongo import ElderDB

class HelpPostAgent:
    def __init__(self, model: str):
        import os
        ollama_url = os.getenv('OLLAMA_URL', 'http://localhost:11434')
        self.llm = ChatOllama(
            model=model,
            temperature=0,
            verbose=False,
            streaming=False,
            callbacks=[PrintCallbackHandler()],
            base_url=ollama_url,
        )

        self.memory = SafeConversationMemory(
            memory_key="chat_history",
            return_messages=True,
        )

        # MongoDB
        db = ElderDB()
        self.users_collection = db.connect_collection(
            db_name="community_platform",
            collection_name="users",
        )
        self.helpposts_collection = db.connect_collection(
            db_name="community_platform",
            collection_name="helpposts",
        )

        self.agent = self.build_agent()

    def build_agent(self) -> AgentExecutor:
        """
        Builds a LangGraph ReAct Agent that supports multi-input tools.
        """
        system_template = """
        You are a smart helper agent that manages community help posts. Users can have multiple posts.

        INTELLIGENT WORKFLOW:
        1. Analyze the user's query to determine the intended operation:
           - CREATE: User says "I need help with..." or "I need another help with..." (ALWAYS create new posts)
           - READ: User wants to see their posts or get information
           - UPDATE: User explicitly says "change", "modify", "update" referring to existing posts
           - DELETE: User says "delete", "found someone", "remove" referring to existing posts

        2. For multiple posts, intelligently identify which post to modify (only for UPDATE/DELETE):
           - Look for keywords in the query that match existing post content
           - If user says "I found someone to help with [topic]", find and delete that specific post
           - If user says "change the post about [topic] to [new topic]", find and update that specific post
           - If user mentions a specific topic that matches a post, target that post

        OPERATION CLASSIFICATION:
        - CREATE: "I need help with [topic]", "I need another help with [topic]" (brand new request)
        - READ: "Show me my posts", "What posts do I have"
        - UPDATE: Any correction/change phrasing such as:
          "I made a mistake", "actually", "instead", "change", "modify", "update", "correct it", "should be [new topic]" → use edit_post
          Example: "I made a mistake. I need help with hardware setup" means UPDATE the relevant existing post to "hardware setup" (do NOT create a new one)
        - DELETE: Any removal phrasing such as:
          "delete", "remove", "close", "cancel", "no longer need", "found someone" → MUST use delete_post (never edit_post)

        CRITICAL RULES:
        - Users can have multiple posts - each is independent
        - CREATE: When user says "I need help with..." or "I need another help with..." → ALWAYS create_post (never edit existing)
        - UPDATE: Only when user says "change my post", "modify my post", "update my post" → use edit_post
        - DELETE: When user says "delete", "found someone to help", "remove" → use delete_post (NOT edit_post)
        - NEVER use edit_post for deletion - always use delete_post
        - NEVER edit existing posts when user asks for help - always create new posts
        - Use post content matching to identify which specific post to modify (for UPDATE/DELETE only)
        - For CREATE: Do NOT call get_user_posts. Call create_post directly once and STOP.
        - For UPDATE: Prefer edit_post with either post_id OR (user_id and about/match keyword). If no keyword, target the most recent post for that user. Call once and STOP.
        - For DELETE: Use delete_post with post_id if available; otherwise pass user_id and about/match keyword (e.g., delete_post: 'user_id="001", about="hardware setup"'). Do NOT use edit_post for deletion. Call once and STOP.
        - Never call edit_post with an empty new_text; if you intend to remove a post, use delete_post.
        - Never call the same tool more than once per task. Never wrap tool calls in code fences. Use exact tool name.

        Tool Usage Examples:
        - get_user_posts: user_id="001"
        - create_post: 'query="I need help moving furniture", user_id="001", role="elderly", location="Sham Shui Po"'
        - edit_post: 'post_id="68ee5a4c7872a878ac5b439c", new_text="Need help with computer setup"'
        - delete_post: 'post_id="68ee5a4c7872a878ac5b439c"' OR 'user_id="001", about="grocery"'
        
        CRITICAL: When calling create_post, you MUST include ALL four parameters: query, user_id, role, and location.
        Use the exact values provided in the User ID, User Role, and User Location fields above.
        """

        tools = self.get_tools()
        react_prompt = hub.pull("hwchase17/react")
        
        # Create a custom prompt that includes our system instructions
        # Escape all curly braces in system_template to avoid conflicts with ReAct template variables
        escaped_system_template = system_template.replace('{', '{{').replace('}', '}}')
        custom_prompt = PromptTemplate.from_template(
            escaped_system_template + "\n\n" + react_prompt.template
        )
        
        agent = create_react_agent(self.llm, tools, custom_prompt)
        
        return AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=False,
            handle_parsing_errors=True,
            memory=self.memory,
            max_iterations=6,
            early_stopping_method="generate",
            return_intermediate_steps=True
        )

    def get_tools(self) -> List[BaseTool]:
        @tool("get_user_posts")
        def get_user_posts(user_id: str) -> Dict[str, Any]:
            """
            Return existing help posts for the given user_id.
            
            Args:
                user_id: The user ID to search for posts (e.g., "001")
            """
            if not user_id:
                return {"error": "user_id is required."}

            # Clean up user_id - handle cases where agent passes 'user_id="001"' or just '"001"'
            user_id = user_id.strip()
            if 'user_id=' in user_id:
                user_id = user_id.split('user_id=')[1].strip().strip('"').strip("'")
            else:
                user_id = user_id.strip('"').strip("'")

            cursor = self.helpposts_collection.find({"user_id": user_id})
            posts: List[Dict[str, Any]] = []
            for doc in cursor:
                doc = {**doc}
                doc["_id"] = str(doc.get("_id"))
                posts.append(doc)

            if not posts:
                return {"posts": []}
            return {"posts": posts}

        @tool("get_user_info")
        def get_user_info(user_id: str) -> Dict[str, Any]:
            """Get user information from the users collection by user_id."""
            # Clean up user_id - handle cases where agent passes 'user_id="001"' or just '"001"'
            user_id = user_id.strip()
            if 'user_id=' in user_id:
                user_id = user_id.split('user_id=')[1].strip().strip('"').strip("'")
            else:
                user_id = user_id.strip('"').strip("'")
            user = self.users_collection.find_one({"user_id": user_id})
            if user:
                user.pop("_id", None)
                return user
            return {"error": f"User {user_id} not found."}

        @tool("create_post")
        def create_post(parameters: str) -> Dict[str, Any]:
            """
            Create a structured help post from the user's natural-language query.
            Pass ALL parameters as a single string in this format: query="help text", user_id="002", role="youth", location="Mong Kok"
            
            Args:
                parameters: String containing all parameters: query, user_id, role, location
            """
            import re
            
            # Parse parameters from string
            query = None
            user_id = None
            role = None
            location = None
            
            # Extract query
            query_match = re.search(r'query[=\s]*["\']([^"\']+)["\']', parameters)
            if query_match:
                query = query_match.group(1).strip()
            
            # Extract user_id
            user_id_match = re.search(r'user_id[=\s]*["\']?([^",\s]+)["\']?', parameters)
            if user_id_match:
                user_id = user_id_match.group(1).strip().strip('"').strip("'")
            
            # Extract role
            role_match = re.search(r'role[=\s]*["\']?([^",\s]+)["\']?', parameters)
            if role_match:
                role = role_match.group(1).strip().strip('"').strip("'")
            
            # Extract location
            location_match = re.search(r'location[=\s]*["\']([^"\']+)["\']', parameters)
            if location_match:
                location = location_match.group(1).strip()
            
            if not query:
                return {"error": "Missing query parameter"}
            if not user_id:
                return {"error": "Missing user_id parameter"}
            if not role:
                return {"error": "Missing role parameter"}
            if not location:
                return {"error": "Missing location parameter"}
            
            user = {"user_id": user_id, "role": role, "location": location}
            if not user_id:
                return {"error": "Missing user_id for create_post."}

            template = """
            Extract structured help post info from the query below:
            "{query}"

            From the query, use your knowledge to extract the skills that will be required to accomplish the task given in the query. 
            Also, summarize the text to be concise and clear, removing unnecessary words.

            Always return a **strict valid JSON** with fields:
            - "text": string, concise summary of help request (remove words like "I need", "help with", "actually", etc.)
            - "required_skills": list of short keywords (e.g. ["strength", "programming"])
            """
            prompt = PromptTemplate.from_template(template)
            chain = prompt | self.llm
            raw = chain.invoke({"query": query})

            if hasattr(raw, "content"):
                raw = raw.content

            raw_text = str(raw).strip()

            fenced_match = re.search(
                r"```(?:json)?\s*(\{.*?\})\s*```",
                raw_text,
                re.DOTALL | re.IGNORECASE,
            )
            candidate_json = fenced_match.group(1) if fenced_match else raw_text

            try:
                parsed = json.loads(candidate_json)
            except JSONDecodeError:
                decoder = JSONDecoder()
                try:
                    parsed, _ = decoder.raw_decode(candidate_json)
                except Exception:
                    parsed = {"text": query, "required_skills": []}

            if not isinstance(parsed, dict):
                parsed = {"text": query, "required_skills": []}

            raw_skills = parsed.get("required_skills", [])
            if isinstance(raw_skills, str):
                raw_skills = [s.strip() for s in re.split(r",|\n", raw_skills) if s.strip()]
            elif not isinstance(raw_skills, list):
                raw_skills = []

            post_doc = {
                "user_id": user_id,
                "role": user.get("role", "Unknown"),
                "location": user.get("location", "Unknown"),
                "interests": user.get("interests", []),
                "text": parsed.get("text", query),
                "required_skills": raw_skills,
                "status": "open",  # open, matched, completed
                "matched_helper_id": None,
                "matched_helper_name": None
            }

            result = self.helpposts_collection.insert_one(post_doc)

            status = {
                "message": "Post created successfully.",
                "post_id": str(result.inserted_id),
            }

            status["post"] = post_doc
            return status

        @tool("edit_post")
        def edit_post(parameters: str) -> Dict[str, Any]:
            """Update a help post.

            Pass parameters as a single string. Supported fields:
            - post_id="<ObjectId>" (preferred)
            - user_id="001" and topic/about/match="keyword" to pick the post by matching its text
            - new_text="updated text" (will be summarized)
            - new_required_skills="skill1, skill2"
            """
            import re
            
            # Parse parameters from string
            post_id = None
            user_id = None
            new_text = None
            new_required_skills = None
            match_text = None
            
            # Extract post_id
            post_id_match = re.search(r'post_id[=\s]*["\']?([^",\s]+)["\']?', parameters)
            if post_id_match:
                post_id = post_id_match.group(1).strip().strip('"').strip("'")
            
            # Extract user_id
            user_id_match = re.search(r'user_id[=\s]*["\']?([^",\s]+)["\']?', parameters)
            if user_id_match:
                user_id = user_id_match.group(1).strip().strip('"').strip("'")
            
            # Extract new_text - handle missing quotes and various formats
            new_text_match = re.search(r'new_text[=\s]*["\']?([^,"\'=]*?)(?:["\']|,|$)', parameters)
            if new_text_match:
                new_text = new_text_match.group(1).strip()
            
            # Extract new_required_skills
            skills_match = re.search(r'new_required_skills[=\s]*["\']?([^",\n]+)["\']?', parameters)
            if skills_match:
                skills_str = skills_match.group(1).strip().strip('"').strip("'")
                new_required_skills = [s.strip() for s in re.split(r",|\n", skills_str) if s.strip()]

            # Topic match (accept topic=, about=, match=, match_text=)
            topic_match = re.search(r'(?:topic|about|match|match_text)[=\s]*["\']([^"\']+)["\']', parameters)
            if topic_match:
                match_text = topic_match.group(1).strip()

            updates = {}
            
            if new_text:
                # Summarize the text to be more concise
                summary_prompt = f"""
                Summarize this help request into a concise, clear statement of what help is needed.
                Remove unnecessary words like "actually", "change my request", "instead of", "to need help with", etc.
                Focus on the core help needed.
                
                Original: {new_text}
                
                Summarized:
                """
                try:
                    summary_chain = PromptTemplate.from_template(summary_prompt) | self.llm
                    summary_result = summary_chain.invoke({})
                    if hasattr(summary_result, "content"):
                        summary_text = summary_result.content.strip()
                    else:
                        summary_text = str(summary_result).strip()
                    # Clean up any LLM response artifacts
                    if "It seems there's no original text" in summary_text or "Please provide the original text" in summary_text:
                        # Fallback: simple text cleaning
                        summary_text = new_text.replace("to need help with", "").replace("instead", "").strip()
                    updates["text"] = summary_text
                except Exception:
                    updates["text"] = new_text  # Fallback to original text

            if new_required_skills:
                updates["required_skills"] = new_required_skills

            # Hard guard: do not allow empty update (prevents accidental delete via edit)
            if not updates:
                return {
                    "error": "No update fields provided. If the intent is to delete, call delete_post instead of edit_post."
                }

            query: Dict[str, Any] = {}
            if post_id:
                try:
                    query["_id"] = ObjectId(post_id)
                except Exception:
                    return {"error": "Invalid post_id; must be a valid ObjectId string."}
            elif user_id and match_text:
                # Heuristic: find the most recent post for user where text contains the match keyword
                try:
                    candidate = self.helpposts_collection.find({
                        "user_id": user_id,
                        "text": {"$regex": match_text, "$options": "i"}
                    }).sort("_id", -1).limit(1)
                    candidate_list = list(candidate)
                    if not candidate_list:
                        return {"error": f"No post found for user {user_id} matching '{match_text}'"}
                    query["_id"] = candidate_list[0]["_id"]
                except Exception as e:
                    return {"error": f"Match search failed: {e}"}
            elif user_id:
                # Fallback: update the most recent post by the user
                try:
                    last = list(self.helpposts_collection.find({"user_id": user_id}).sort("_id", -1).limit(1))
                    if not last:
                        return {"error": f"No posts found for user {user_id}"}
                    query["_id"] = last[0]["_id"]
                except Exception as e:
                    return {"error": f"Lookup failed: {e}"}
            else:
                return {"error": "Provide post_id or user_id to identify the post."}

            res = self.helpposts_collection.update_one(query, {"$set": updates})
            if res.matched_count == 0:
                return {"error": "No matching post found to update.", "applied_updates": updates}
            return {"matched": res.matched_count, "modified": res.modified_count, "applied_updates": updates}

        @tool("delete_post")
        def delete_post(parameters: str) -> Dict[str, Any]:
            """Delete a specific help post.

            Accepts either post_id="..." OR user_id+about/match keyword to find a post.
            Examples:
            - post_id="68ef..."
            - user_id="001", about="grocery"  (deletes the newest post whose text contains the keyword)
            """
            import re
            post_id = None
            user_id = None
            match_text = None

            pid = re.search(r'post_id[=\s]*["\']?([^",\s]+)["\']?', parameters)
            if pid:
                post_id = pid.group(1).strip().strip('"').strip("'")
            uid = re.search(r'user_id[=\s]*["\']?([^",\s]+)["\']?', parameters)
            if uid:
                user_id = uid.group(1).strip().strip('"').strip("'")
            topic = re.search(r'(?:topic|about|match|match_text)[=\s]*["\']([^"\']+)["\']', parameters)
            if topic:
                match_text = topic.group(1).strip()

            try:
                if post_id:
                    res = self.helpposts_collection.delete_one({"_id": ObjectId(post_id)})
                    return {"deleted_count": res.deleted_count, "post_id": post_id}
                if user_id and match_text:
                    candidate = list(self.helpposts_collection.find({
                        "user_id": user_id,
                        "text": {"$regex": match_text, "$options": "i"}
                    }).sort("_id", -1).limit(1))
                    if not candidate:
                        return {"error": f"No post found for user {user_id} matching '{match_text}'"}
                    pid = candidate[0]["_id"]
                    res = self.helpposts_collection.delete_one({"_id": pid})
                    return {"deleted_count": res.deleted_count, "post_id": str(pid)}
                return {"error": "Provide post_id or user_id+about keyword to delete."}
            except Exception as e:
                return {"error": str(e), "deleted_count": 0}

        return [get_user_posts, get_user_info, create_post, edit_post, delete_post]

    def run(self, state: Dict[str, Any]) -> Any:
        """
        Runs the HelpPostAgent given a structured state:
        {
            "user": {"user_id": "...", "role": "...", "location": "..."},
            "query": "User's natural-language request"
        }
        """
        user = state['user']
        prompt = (
            "You will help manage a community help post.\n"
            f"User ID: {user['user_id']}\n"
            f"User Role: {user['role']}\n"
            f"User Location: {user['location']}\n"
            f"Request: {state['query']}\n\n"
            "IMPORTANT: Tools available: get_user_posts, get_user_info, create_post, edit_post, delete_post.\n"
            "Do NOT use markdown or code fences. Output only the tool call when needed.\n"
            "When creating a post, you MUST use the exact user_id, role, and location provided above."
        )
        try:
            result = self.agent.invoke({"input": prompt})
            return result
        except Exception as e:
            return {"error": str(e)}
       
if __name__ == "__main__":
    agent = HelpPostAgent(model="llama3.1")
    state = {
        "user": {"user_id": "001", "role": "elderly", "location": "Sham Shui Po"},
        "query": "I have found someone who will help me with baking. Delete that post for me.",
    }
    results = agent.run(state)
    print("Agent Result:", results)
