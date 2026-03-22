# backend/services/llm_service.py
import os

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()


class LLMService:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.2,
        )

    def get_ai_response(self, final_prompt: str):
        try:
            response = self.llm.invoke(final_prompt)
            return response.content

        except Exception as e:
            print(f"LangChain LLM Error: {e}")
            return "I'm sorry, I encountered an error processing your legal query."


llm_service = LLMService()
