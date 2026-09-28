import json

site_name = "banyan.morso.top"

def make_data():
    data = {"messsage": "hello", "from": site_name}
    return json.dumps(data)

print(make_data())