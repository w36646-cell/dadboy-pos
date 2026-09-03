import { useEffect, useRef, useState } from "react";

const OWNER_PIN_KEY =

  "dadboy_owner_pin";

const DEFAULT_OWNER_PIN =

  "8000";

function getOwnerPin() {

  return (

    localStorage.getItem(

      OWNER_PIN_KEY

    ) ||

    DEFAULT_OWNER_PIN

  );

}

function OwnerLogin({

  open,

  onSuccess,

  onClose,

}) {

  const [pin, setPin] = useState("");

  const [error, setError] = useState("");

  const inputRef = useRef(null);

  useEffect(() => {

    if (!open) {

      return;

    }

    setPin("");

    setError("");

    setTimeout(() => {

      inputRef.current?.focus();

    }, 50);

  }, [open]);

  if (!open) {

    return null;

  }

  function submitPin(event) {

    event.preventDefault();

    if (pin === getOwnerPin()) {

      setPin("");

      setError("");

      onSuccess();

      return;

    }

    setPin("");

    setError("PIN ไม่ถูกต้อง");

    inputRef.current?.focus();

  }

  function pressNumber(number) {

    setError("");

    setPin((currentPin) => {

      if (currentPin.length >= 4) {

        return currentPin;

      }

      return `${currentPin}${number}`;

    });

  }

  function removeNumber() {

    setError("");

    setPin((currentPin) =>

      currentPin.slice(0, -1)

    );

  }

  function clearPin() {

    setPin("");

    setError("");

    inputRef.current?.focus();

  }

  return (
<div

      className="owner-login-overlay"

      onClick={onClose}
>
<form

        className="owner-login-box"

        onSubmit={submitPin}

        onClick={(event) =>

          event.stopPropagation()

        }
>
<h2>โหมดเจ้าของร้าน</h2>
<p>

          กรุณาใส่ PIN 4 หลัก
</p>
<input

          ref={inputRef}

          className="owner-pin-input"

          type="password"

          inputMode="numeric"

          maxLength="4"

          value={pin}

          onChange={(event) => {

            const numbersOnly =

              event.target.value.replace(

                /\D/g,

                ""

              );

            setPin(

              numbersOnly.slice(0, 4)

            );

            setError("");

          }}

          aria-label="PIN เจ้าของร้าน"

        />
<div className="owner-pin-dots">

          {[0, 1, 2, 3].map((index) => (
<span

              key={index}

              className={

                pin.length > index

                  ? "owner-pin-dot active"

                  : "owner-pin-dot"

              }

            />

          ))}
</div>

        {error && (
<div className="owner-login-error">

            {error}
</div>

        )}
<div className="owner-number-pad">

          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(

            (number) => (
<button

                key={number}

                type="button"

                onClick={() =>

                  pressNumber(number)

                }
>

                {number}
</button>

            )

          )}
<button

            type="button"

            className="owner-clear-button"

            onClick={clearPin}
>

            ล้าง
</button>
<button

            type="button"

            onClick={() => pressNumber(0)}
>

            0
</button>
<button

            type="button"

            className="owner-delete-button"

            onClick={removeNumber}
>

            ⌫
</button>
</div>
<button

          className="owner-login-submit"

          type="submit"

          disabled={pin.length !== 4}
>

          เข้าสู่โหมดเจ้าของ
</button>
<button

          className="owner-login-cancel"

          type="button"

          onClick={onClose}
>

          ยกเลิก
</button>
</form>
</div>

  );

}

export default OwnerLogin;
 
