import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY")
    PASSWORD = os.getenv("PASSWORD")
    DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
    DATA_URL = os.getenv("DATA_URL")
