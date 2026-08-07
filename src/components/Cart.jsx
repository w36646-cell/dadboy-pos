function Cart({

  cart,

  total,

  increaseQty,

  decreaseQty,

  removeItem,

}) {

  return (
<aside className="cart">
<h2>🛒 ตะกร้าสินค้า</h2>

      {cart.length === 0 ? (
<p className="empty-cart">ยังไม่มีสินค้า</p>

      ) : (

        cart.map((item, index) => (
<div className="cart-item" key={`${item.id}-${item.option}`}>
<div className="cart-info">
<div className="cart-name">{item.name}</div>
<div className="cart-option">{item.option}</div>
<div className="cart-unit-price">

                ราคา {item.price} บาท
</div>
</div>
<div className="cart-controls">
<button

                className="qty-button"

                onClick={() => decreaseQty(index)}
>

                −
</button>
<span className="cart-quantity">{item.qty}</span>
<button

                className="qty-button"

                onClick={() => increaseQty(index)}
>

                +
</button>
</div>
<div className="cart-item-total">

              {item.price * item.qty} บาท
</div>
<button

              className="remove-button"

              onClick={() => removeItem(index)}
>

              ลบ
</button>
</div>

        ))

      )}
<hr />
<div className="grand-total">
<span>รวมทั้งหมด</span>
<span>{total} บาท</span>
</div>
<button

        className="pay-btn"

        disabled={cart.length === 0}
>

        คิดเงิน
</button>
</aside>

  );

}

export default Cart;
 