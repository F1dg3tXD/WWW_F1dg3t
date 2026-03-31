from app.bot import client
from app.config import Config

client.run(Config.DISCORD_TOKEN)