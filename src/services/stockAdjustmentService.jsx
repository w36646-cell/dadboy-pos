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

export async function applySelfUseOnce(

  operationId,

  productId,

  stockQuantity,

  note = null,

  adjustedAt = null

) {

  const safeOperationId =

    String(

      operationId || ""

    ).trim();

  const safeProductId =

    String(

      productId || ""

    ).trim();

  const safeStockQuantity =

    Number(

      stockQuantity

    );


  if (!safeOperationId) {

    throw new Error(

      "Self-use operationId is required"

    );

  }


  if (!safeProductId) {

    throw new Error(

      "Self-use productId is required"

    );

  }


  if (

    !Number.isSafeInteger(

      safeStockQuantity

    ) ||

    safeStockQuantity <= 0

  ) {

    throw new Error(

      `Invalid self-use stock quantity: ${stockQuantity}`

    );

  }


  const {

    data,

    error,

  } = await supabase

    .rpc(

      "apply_self_use_once",

      {

        p_operation_id:

          safeOperationId,

        p_product_id:

          safeProductId,

        p_stock_quantity:

          safeStockQuantity,

        p_note:

          note || null,

        p_adjusted_at:

          adjustedAt ||

          new Date().toISOString(),

      }

    )

    .single();


  if (error) {

    throw error;

  }


  if (!data) {

    throw new Error(

      `Self-use returned no data: ${safeOperationId}`

    );

  }


  return {

    id:

      String(

        data.product_id

      ),

    previousStock:

      Number(

        data.previous_stock

      ),

    stock:

      Number(

        data.new_stock

      ),

    alreadyApplied:

      data.already_applied === true,

  };

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
