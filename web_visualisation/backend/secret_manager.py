import json
import boto3
from botocore.exceptions import ClientError

def get_secret(secret_name):
    client = boto3.client("secretsmanager")
    try:
        get_secret_value_response = client.get_secret_value(SecretId=secret_name)
        
        # Check if 'SecretString' is in the response
        if 'SecretString' in get_secret_value_response:
            secret = get_secret_value_response['SecretString']
            return json.loads(secret)
        else:
            raise Exception(f"SecretString not found in the response for {secret_name}")
    
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            raise Exception(f"Secret '{secret_name}' not found.")
        else:
            raise Exception(f"Could not retrieve secret: {str(e)}")
    except Exception as e:
        raise Exception(f"An unknown error occurred: {str(e)}")

# Retrieve the secret (Fix this part when scaling up the project with more secrets)
secret_name = "masters-project"
secret = get_secret(secret_name)
mapbox_access_token = secret["mapbox_public"]
