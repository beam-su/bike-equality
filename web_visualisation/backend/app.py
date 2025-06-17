from flask import Flask, jsonify
from flask_cors import CORS
from secret_manager import get_secret

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/get-mapbox-token', methods=['GET'])
def get_mapbox_token():
    secret_name = "masters-project"
    try:
        # Retrieve the secret
        secret = get_secret(secret_name)
        mapbox_token = secret.get("mapbox_public")
        if not mapbox_token:
            raise KeyError("Mapbox public token ('mapbox_public') not found in secret.")
        
        return jsonify({"mapbox_access_token": mapbox_token})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
