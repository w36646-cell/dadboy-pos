function CartPanel({

  cart,

  totalQty,

  total,

  onChangeCartQty,

  onIncreaseQty,

  onDecreaseQty,

  onRemoveItem,

  onPayment,

}) {

  return (
<aside className="cart-panel">
<div className="cart-header">
<h2>

          ตะกร้า
</h2>
<span className="cart-badge">

          {totalQty}
</span>
</div>
<div className="cart-list">

        {cart.length === 0 ? (
<p className="empty-cart">

            ยังไม่มีสินค้า
</p>

        ) : (

          cart.map(

            (

              item,

              index

            ) => (
<div

                className="cart-item"

                key={

  item.cartLineId ||

  `${item.id}-${item.option}-${item.saleType || "unit"}-${index}`

}
 
>
<div className="cart-item-header">
<div>
<strong>

                      {item.name}
</strong>
<div className="cart-option">

                      {item.option}{" "}

                      ·{" "}

                      {item.price}{" "}

                      บาท
</div>

                    {item.saleType ===

                      "pack" && (
<div

                        style={{

                          marginTop:

                            "3px",

                          fontSize:

                            "11px",

                          color:

                            "#667085",

                        }}
>

                        1 แพ็กใช้สต๊อก{" "}

                        {Number(

                          item.stockPerUnit ||

                            item.packQty ||

                            1

                        )}{" "}

                        ชิ้น
</div>

                    )}
</div>
<button

                    className="remove-button"

                    type="button"

                    onClick={() =>

                      onRemoveItem(

                        index

                      )

                    }
>

                    ลบ
</button>
</div>
<div className="cart-item-bottom">
<div className="quantity-controls">
<button

                      type="button"

                      onClick={() =>

                        onDecreaseQty(

                          index

                        )

                      }
>

                      −
</button>
<input

                      className="quantity-input"

                      type="number"

                      min="1"

                      value={

                        item.qty

                      }

                      onChange={(

                        event

                      ) =>

                        onChangeCartQty(

                          index,

                          event

                            .target

                            .value

                        )

                      }

                    />
<button

                      type="button"

                      onClick={() =>

                        onIncreaseQty(

                          index

                        )

                      }
>

                      +
</button>
</div>
<strong>

                    {Number(

                      Number(

                        item.price ||

                          0

                      ) *

                        Number(

                          item.qty ||

                            0

                        )

                    ).toLocaleString()}{" "}

                    บาท
</strong>
</div>
</div>

            )

          )

        )}
</div>
<div className="grand-total">
<span>

          รวมทั้งหมด
</span>
<span>

          {Number(

            total || 0

          ).toLocaleString()}{" "}

          บาท
</span>
</div>
<button

        className="pay-button"

        type="button"

        disabled={

          cart.length === 0

        }

        onClick={

          onPayment

        }
>

        คิดเงิน
</button>
</aside>

  );

}

export default CartPanel;
 
