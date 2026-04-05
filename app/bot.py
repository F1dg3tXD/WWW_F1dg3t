import discord
from discord import app_commands
import requests
from datetime import datetime
from zoneinfo import ZoneInfo
from astral import LocationInfo
from astral.sun import sun
from .config import Config

class BotClient(discord.Client):
    def __init__(self):
        super().__init__(intents=discord.Intents.default())
        self.tree = app_commands.CommandTree(self)
        self.synced = False

    async def setup_hook(self):
        await self.tree.sync()

    async def on_ready(self):
        if self.synced:
            return

        await self.tree.sync()
        for guild in self.guilds:
            await self.tree.sync(guild=guild)

        self.synced = True

client = BotClient()

def get_data():
    """
    Fetch JSON directly from a URL.
    """
    try:
        response = requests.get(Config.DATA_URL, timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error fetching data: {e}")
        # Return fallback/default data if needed
        return {
            "timezone": "UTC",
            "location": "Unknown",
            "why": "N/A",
            "what": "N/A"
        }

@client.tree.command(name="when")
async def when(interaction: discord.Interaction):
    data = get_data()

    tz = ZoneInfo(data["timezone"])
    now = datetime.now(tz)

    loc = LocationInfo(timezone=data["timezone"])
    s = sun(loc.observer, date=now.date())

    msg = (
        f"🕒 {now.strftime('%Y-%m-%d %H:%M:%S')}\n"
        f"🌅 Sunrise: {s['sunrise'].astimezone(tz).strftime('%H:%M')}\n"
        f"🌇 Sunset: {s['sunset'].astimezone(tz).strftime('%H:%M')}"
    )

    await interaction.response.send_message(msg)

@client.tree.command(name="where")
async def where(interaction: discord.Interaction):
    data = get_data()
    await interaction.response.send_message(f"📍 {data['location']}")

@client.tree.command(name="why")
async def why(interaction: discord.Interaction):
    data = get_data()
    await interaction.response.send_message(f"💭 Why: {data['why']}")

@client.tree.command(name="what")
async def what(interaction: discord.Interaction):
    data = get_data()
    await interaction.response.send_message(f"📌 What: {data['what']}")

@client.tree.command(name="email")
async def email(interaction: discord.Interaction):
    if not Config.MAILTO:
        await interaction.response.send_message(
            "Email link is not configured on this bot.",
            ephemeral=True
        )
        return

    view = discord.ui.View()
    view.add_item(discord.ui.Button(label="Email", url=f"mailto:{Config.MAILTO}"))

    await interaction.response.send_message(
        "Use the button below to open your email client.",
        view=view,
        ephemeral=True
    )
