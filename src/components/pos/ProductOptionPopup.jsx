function ProductOptionPopup({

  product,

  selectedOption,

  quantity,

  onSelectOption,

  onChangeQuantity,

  onConfirm,

  onClose,

}) {

  if (

    !product ||

    !selectedOption

  ) {

    return null;

  }

  const safeQuantity =

    Math.max(

      1,

      Number(

        quantity

      ) || 1

    );

  const total =

    Number(

      selectedOption.price ||

        0

    ) *

    safeQuantity;

  function decreaseQuantity() {

    onChangeQuantity(

      Math.max(

        1,

        safeQuantity - 1

      )

    );

  }

  function increaseQuantity() {

    onChangeQuantity(

      safeQuantity + 1

    );

  }

  function handleQuantityChange(

    event

  ) {

    onChangeQuantity(

      Math.max(

        1,

        Number(

          event.target.value

        ) || 1

      )

    );

  }

  return (
<div

      className="popup-overlay"

      onClick={

        onClose

      }
>
<div

        className="popup"

        onClick={(

          event

        ) =>

          event.stopPropagation()

        }
>
<h2>

          {product.name}
</h2>
<div className="option-list">

          {(product.options || []).map(

            (option) => (
<label

                className={
selectedOption.id ===
option.id

                    ? "option-button selected-option"

                    : "option-button"

                }

                key={
option.id

                }
>
<span>
<input

                    type="radio"

                    name="product-option"

                    checked={
selectedOption.id ===
option.id

                    }

                    onChange={() =>

                      onSelectOption({

                        ...option,

                        saleType:

                          "unit",

                        stockPerUnit:

                          1,

                      })

                    }

                  />{" "}

                  {option.name}
</span>
<strong>

                  {Number(

                    option.price ||

                      0

                  ).toLocaleString()}{" "}

                  บาท
</strong>
</label>

            )

          )}
</div>
<div className="popup-quantity">
<button

            type="button"

            onClick={

              decreaseQuantity

            }
>

            −
</button>
<input

            className="quantity-input"

            type="number"

            min="1"

            value={

              safeQuantity

            }

            onChange={

              handleQuantityChange

            }

          />
<button

            type="button"

            onClick={

              increaseQuantity

            }
>

            +
</button>
</div>
<div className="popup-total">

          รวม{" "}

          {total.toLocaleString()}{" "}

          บาท
</div>
<button

          className="pay-button"

          type="button"

          onClick={

            onConfirm

          }
>

          เพิ่มลงตะกร้า
</button>
<button

          className="cancel-button"

          type="button"

          onClick={

            onClose

          }
>

          ยกเลิก
</button>
</div>
</div>

  );

}

export default ProductOptionPopup;
 