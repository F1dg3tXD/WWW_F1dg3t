from flask import Blueprint, render_template, request, redirect, session, jsonify, url_for
from .config import Config
from .storage import load_data, save_data
from .auth import login_required

bp = Blueprint("main", __name__)

@bp.route("/")
def root():
    if session.get("logged_in"):
        return redirect(url_for("main.dashboard"))
    return redirect(url_for("main.login"))

@bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        if request.form.get("password") == Config.PASSWORD:
            session["logged_in"] = True
            return redirect(url_for("main.dashboard"))
    return render_template("login.html")

@bp.route("/dashboard", methods=["GET", "POST"])
@login_required
def dashboard():
    data = load_data()
    if request.method == "POST":
        data["timezone"] = request.form.get("timezone", data.get("timezone"))
        data["location"] = request.form.get("location", data.get("location"))
        data["why"] = request.form.get("why", data.get("why"))
        data["what"] = request.form.get("what", data.get("what"))
        save_data(data)
    return render_template("dashboard.html", data=data)

@bp.route("/api/data")
def api_data():
    return jsonify(load_data())
