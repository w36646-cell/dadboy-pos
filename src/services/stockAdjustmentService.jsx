import { supabase } from "../lib/supabase";

function getAdjustmentId(

  adjustment

) {

  if (

    adjustment.adjustmentId

  ) {

    return String(

      adjustment.adjustmentId

    );

  }

  const productId =

    String(

      adjustment.productId

    );

  const adjustedAt =

    String(

      adjustment.adjustedAt ||

      new Date().toISOString()

    );

  return `${productId}-${adjustedAt}`;

}

export async function saveStockAdjustment(

  adjustment

) {

  const adjustmentId =

    getAdjustmentId(

      adjustment

    );

  const payload = {

    adjustment_id:

      adjustmentId,

    product_id:

      String(

        adjustment.productId

      ),

    product_name:

      adjustment.productName ||

      "",

    previous_stock:

      Number(

        adjustment.previousStock

      ),

    actual_stock:

      Number(

        adjustment.actualStock

      ),

    difference:

      Number(

        adjustment.difference

      ),

    reason:

      adjustment.reason ||

      "อื่นๆ",

    note:

      adjustment.note ||

      null,

    adjusted_at:

      adjustment.adjustedAt ||

      new Date().toISOString(),

  };

  const {

    data,

    error,

  } = await supabase

    .from(

      "stock_adjustments"

    )

    .upsert(

      payload,

      {

        onConflict:

          "adjustment_id",

      }

    )

    .select()

    .single();

  if (error) {

    throw error;

  }

  return data;

}
