import json
from .config import Config

def load_data():
    with open(Config.DATA_FILE, "r") as f:
        return json.load(f)

def save_data(data):
    with open(Config.DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)