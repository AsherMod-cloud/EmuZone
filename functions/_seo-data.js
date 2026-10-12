const PROJECT_ID = "emulator-games-id-bf695";
const COLLECTION = "games";
const SITE_URL = "https://emuzone.my.id";

function stringValue(field) {
  return field?.stringValue || "";
}

function timestampValue(field) {
  const value = field?.timestampValue;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function documentSlug(document) {
  const fields = document?.fields || {};
  return stringValue(fields.slug).trim();
}

function documentLastModified(document) {
  const fields = document?.fields || {};
  return timestampValue(fields.updatedAt)
    || timestampValue(fields.createdAt)
    || null;
}

export async function fetchGameDocuments() {
  const documents = [];
  let pageToken = "";
  const maxPages = 20;

  for (let page = 0; page < maxPages; page++) {
    const url = new URL(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}`
    );
    url.searchParams.set("pageSize", "1000");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetch(url, {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Firestore listDocuments failed: ${response.status}`);
    }

    const data = await response.json();
    documents.push(...(data.documents || []));
    pageToken = data.nextPageToken || "";
    if (!pageToken) break;
  }

  return documents;
}

export { SITE_URL, documentLastModified, documentSlug };
