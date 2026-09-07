import { supabase } from "../lib/supabase";


export async function getStockHistory(

  limit = 10

) {

  const safeLimit = Math.min(

    50,

    Math.max(

      1,

      Number(limit) || 10

    )

  );

  const {

    data,

    error,

  } = await supabase.rpc(

    "get_stock_history",

    {

      p_limit: safeLimit,

    }

  );

  if (error) {

    throw error;

  }

  const receives = Array.isArray(

    data?.receives

  )

    ? data.receives.map(

        (row) => ({

          operationId:

            row.operation_id || "",

          productId:

            row.product_id || "",

          productName:

            row.product_name ||

            row.product_id ||

            "-",

          quantity: Number(

            row.quantity || 0

          ),

          previousStock: Number(

            row.previous_stock || 0

          ),

          newStock: Number(

            row.new_stock || 0

          ),

          createdAt:

            row.created_at || null,

        })

      )

    : [];

  const adjustments =

    Array.isArray(

      data?.adjustments

    )

      ? data.adjustments.map(

          (row) => ({

            adjustmentId:

              row.adjustment_id || "",

            productId:

              row.product_id || "",

            productName:

              row.product_name ||

              row.product_id ||

              "-",

            previousStock: Number(

              row.previous_stock || 0

            ),

            actualStock: Number(

              row.actual_stock || 0

            ),

            difference: Number(

              row.difference || 0

            ),

            reason:

              row.reason || "",

            note:

              row.note || "",

            adjustedAt:

              row.adjusted_at ||

              null,

          })

        )

      : [];

  return {

    receives,

    adjustments,

  };

}
 
