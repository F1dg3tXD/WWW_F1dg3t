from werkzeug.middleware.proxy_fix import ProxyFix
from app import create_app

app = create_app()

# Tell Flask it’s behind a proxy with a prefix
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1, x_prefix=1)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
