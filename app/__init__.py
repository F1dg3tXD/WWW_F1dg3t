from flask import Flask
from .config import Config
from .routes import bp
from werkzeug.middleware.proxy_fix import ProxyFix

def create_app():
    app = Flask(__name__, static_url_path='/static', static_folder='static')
    app.config.from_object(Config)

    # Proxy fix for subpath
    app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1, x_prefix=1)

    # Register blueprint under /portal prefix
    app.register_blueprint(bp, url_prefix="/portal")

    return app
