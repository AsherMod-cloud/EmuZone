export async function onRequestGet(context) {
    return new Response(
        "<!DOCTYPE html><html><head><title>CF FUNCTION TEST</title></head><body>FUNCTION WORKS</body></html>",
        {
            status: 200,
            headers: {
                "Content-Type": "text/html; charset=UTF-8"
            }
        }
    );
}