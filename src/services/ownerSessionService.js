import { supabase } from "../lib/supabase";


const OWNER_SESSION_KEY =

  "dadboy_owner_session_v1";


export function getOwnerSessionToken() {

  try {

    return (

      sessionStorage.getItem(

        OWNER_SESSION_KEY

      ) || ""

    );

  } catch {

    return "";

  }

}


export function clearOwnerSessionToken() {

  try {

    sessionStorage.removeItem(

      OWNER_SESSION_KEY

    );

  } catch {

    // ไม่ต้องทำอะไร

  }

}


export async function createOwnerSession(

  pin

) {

  const {

    data,

    error,

  } = await supabase.rpc(

    "create_owner_session",

    {

      p_pin: String(pin),

    }

  );

  if (error) {

    throw error;

  }

  if (

    typeof data !== "string" ||

    !data

  ) {

    return "";

  }

  try {

    sessionStorage.setItem(

      OWNER_SESSION_KEY,

      data

    );

  } catch {

    // ถ้าเก็บไม่ได้

    // ยังคืน token ให้ caller ได้

  }

  return data;

}


export async function verifyOwnerSession() {

  const token =

    getOwnerSessionToken();

  if (!token) {

    return false;

  }

  const {

    data,

    error,

  } = await supabase.rpc(

    "verify_owner_session",

    {

      p_token: token,

    }

  );

  if (error) {

    throw error;

  }

  if (data !== true) {

    clearOwnerSessionToken();

    return false;

  }

  return true;

}


export async function revokeOwnerSession() {

  const token =

    getOwnerSessionToken();

  if (!token) {

    return false;

  }

  const {

    data,

    error,

  } = await supabase.rpc(

    "revoke_owner_session",

    {

      p_token: token,

    }

  );

  if (error) {

    throw error;

  }

  if (data !== true) {

    return false;

  }

  clearOwnerSessionToken();

  return true;

}
 
 
