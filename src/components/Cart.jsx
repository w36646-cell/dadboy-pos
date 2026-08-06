function Cart({ cart, total }) {

  return (

    <div className="cart">

      <h2>ตะกร้าสินค้า</h2>

      {cart.length === 0 ? (

        <p>ยังไม่มีสินค้า</p>

      ) : (

        cart.map((item, index) => (

          <div
            key={index}
            className="cart-item"
          >

            <div className="cart-info">

              <div className="cart-name">

                {item.name}

              </div>

              <div className="cart-option">

                {item.option}

              </div>

            </div>

            <div className="cart-qty">

              x{item.qty}

            </div>

            <div className="cart-price">

              {item.price * item.qty} บาท

            </div>

          </div>

        ))

      )}

      <hr />

      <h3>

        รวม {total} บาท

      </h3>

    </div>

  );

}

export default Cart;