import fs from "node:fs";
import path from "node:path";

type StoredCredential = {
  credentialID: string; // base64url
  credentialPublicKey: string; // base64url (Buffer)
  counter: number;
  transports?: AuthenticatorTransport[];
};

type Store = {
  registered: boolean;
  creds: StoredCredential[];
};

const TMP_PATH = path.join("/tmp", "fabsystem-webauthn.json");

let mem: Store = { registered: false, creds: [] };

function loadFromTmp() {
  try {
    if (fs.existsSync(TMP_PATH)) {
      const raw = fs.readFileSync(TMP_PATH, "utf-8");
      mem = JSON.parse(raw);
    }
  } catch {
    // ignore
  }
}

function saveToTmp() {
  try {
    fs.writeFileSync(TMP_PATH, JSON.stringify(mem), "utf-8");
  } catch {
    // ignore
  }
}

loadFromTmp();

export function hasPasskey() {
  return mem.registered && mem.creds.length > 0;
}

export function getCredentials() {
  return mem.creds;
}

export function upsertCredential(cred: StoredCredential) {
  const idx = mem.creds.findIndex((c) => c.credentialID === cred.credentialID);
  if (idx >= 0) mem.creds[idx] = cred;
  else mem.creds.push(cred);

  mem.registered = true;
  saveToTmp();
}

export function updateCounter(credentialID: string, counter: number) {
  const c = mem.creds.find((x) => x.credentialID === credentialID);
  if (!c) return;
  c.counter = counter;
  saveToTmp();
}