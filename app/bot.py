import re
import smtplib
from email.message import EmailMessage

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

    async def setup_hook(self):
        await self.tree.sync()

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
@app_commands.describe(
    from_email="Email address to send from",
    subject="Subject line for the email"
)
async def email(interaction: discord.Interaction, from_email: str, subject: str):
    if not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", from_email):
        await interaction.response.send_message("Please provide a valid from email address.", ephemeral=True)
        return

    if not Config.SECRET_KEY or not Config.PASSWORD:
        await interaction.response.send_message("Email service is not configured on this bot.", ephemeral=True)
        return

    prefixed_subject = f"WWW_F1dg3t-{subject}"
    to_email = "f1dg3t.rah@gmail.com"

    message = EmailMessage()
    message["From"] = from_email
    message["To"] = to_email
    message["Subject"] = prefixed_subject
    message["Reply-To"] = from_email
    message.set_content(
        f"Email submitted via Discord command /email.\n"
        f"From: {from_email}\n"
        f"Discord User: {interaction.user}"
    )

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login(Config.SECRET_KEY, Config.PASSWORD)
            smtp.sendmail(Config.SECRET_KEY, [to_email], message.as_string())
    except smtplib.SMTPException as e:
        await interaction.response.send_message(f"Failed to send email: {e}", ephemeral=True)
        return

    await interaction.response.send_message(
        f"Email sent to {to_email} with subject `{prefixed_subject}`.",
        ephemeral=True
    )
