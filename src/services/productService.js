import { supabase } from "../lib/supabase";

function normalizeId(id) {

  const value = String(id);

  if (/^\d+$/.test(value)) {

    return Number(value);

  }

  return value;

}

function fromDatabase(row) {

  return {

    id: normalizeId(row.id),

    name: row.name || "",

    category: row.category || "",

    price: Number(row.price || 0),

    cost: Number(row.cost || 0),

    image: row.image || "",

    stock: Number(row.stock ?? 0),

    minStock: Number(row.min_stock ?? 5),

    trackStock: row.track_stock !== false,

    hasOption: row.has_option === true,

    options: Array.isArray(row.options)

      ? row.options

      : [],

  };

}

function toDatabase(product, stock) {

  return {

    id: String(product.id),

    name: product.name || "",

    category: product.category || "",

    price: Number(product.price || 0),

    cost: Number(product.cost || 0),

    image: product.image || "",

    stock: Number(

      stock ??

        product.stock ??

        0

    ),

    min_stock: Number(

      product.minStock ?? 5

    ),

    track_stock:

      product.trackStock !== false,

    has_option:

      product.hasOption === true ||

      product.hasOptions === true,

    options: Array.isArray(product.options)

      ? product.options

      : [],

  };

}

export async function getCloudProducts() {

  const { data, error } =

    await supabase

      .from("products")

      .select("*")

      .order("id");

  if (error) {

    throw error;

  }

  return (data || []).map(

    fromDatabase

  );

}

export async function saveCloudProduct(

  product,

  stock

) {

  const payload =

    toDatabase(

      product,

      stock

    );

  const { data, error } =

    await supabase

      .from("products")

      .upsert(

        payload,

        {

          onConflict: "id",

        }

      )

      .select()

      .single();

  if (error) {

    throw error;

  }

  return fromDatabase(data);

}

export async function uploadProductsToCloud(

  products,

  inventory = {}

) {

  if (

    !Array.isArray(products) ||

    products.length === 0

  ) {

    return [];

  }

  const payload =

    products.map((product) =>

      toDatabase(

        product,

        inventory[product.id] ??

          product.stock ??

          0

      )

    );

  const { data, error } =

    await supabase

      .from("products")

      .upsert(

        payload,

        {

          onConflict: "id",

        }

      )

      .select();

  if (error) {

    throw error;

  }

  return (data || []).map(

    fromDatabase

  );

}

export async function deleteCloudProduct(

  productId

) {

  const { error } =

    await supabase

      .from("products")

      .delete()

      .eq(

        "id",

        String(productId)

      );

  if (error) {

    throw error;

  }

  return true;

}