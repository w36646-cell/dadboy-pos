function ProductPopup({
  product,
  option,
  setOption,
  quantity,
  setQuantity,
  onClose,
  onConfirm,
}) {

  if (!product) return null;

  const total = option.price * quantity;

  return (

    <div className="popup-overlay">

      <div className="popup">

        <h2>{product.name}</h2>

        <div className="popup-image">

          {product.image ? (

            <img
              src={product.image}
              alt={product.name}
            />

          ) : (

            <div className="no-image">

              ไม่มีรูป

            </div>

          )}

        </div>

        <div className="option-list">

          {product.options.map((item) => (

            <label
              key={item.id}
              className="option-item"
            >

              <input
                type="radio"
                checked={option.id === item.id}
                onChange={() => setOption(item)}
              />

              {item.name}

              {"  "}

              {item.price} บาท

            </label>

          ))}

        </div>

        <div className="qty-box">

          <button

            onClick={() => {

              if (quantity > 1) {

                setQuantity(quantity - 1);

              }

            }}

          >

            -

          </button>

          <span>

            {quantity}

          </span>
                    <button

            onClick={() => {

              setQuantity(quantity + 1);

            }}

          >

            +

          </button>

        </div>

        <h3>

          รวม {total} บาท

        </h3>

        <div className="popup-buttons">

          <button

            onClick={onClose}

          >

            ยกเลิก

          </button>

          <button

            onClick={onConfirm}

          >

            เพิ่มลงตะกร้า

          </button>

        </div>

      </div>

    </div>

  );

}

export default ProductPopup;