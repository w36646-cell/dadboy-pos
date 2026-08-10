function PackSettings({

  packQty,

  packEnabled,

  packPrice,

  onChangePackQty,

  onChangePackEnabled,

  onChangePackPrice,

}) {

  const safePackQty =

    Math.max(

      1,

      Number(packQty) || 1

    );

  return (
<div>
<hr />
<h3>

        ข้อมูลแพ็ก
</h3>
<label className="manager-label">

        จำนวนชิ้น / ขวด ต่อ 1 แพ็ก
</label>
<input

        className="manager-input"

        type="number"

        min="1"

        step="1"

        value={packQty}

        onChange={(event) =>

          onChangePackQty(

            event.target.value

          )

        }

      />
<small>

        ใช้สำหรับรับสินค้าเข้า

        เช่น 1 แพ็ก = 12 ขวด
</small>

      {safePackQty >= 2 && (
<>
<hr />
<h3>

            การขายยกแพ็ก
</h3>
<label className="manager-checkbox">
<input

              type="checkbox"

              checked={

                Boolean(

                  packEnabled

                )

              }

              onChange={(event) =>

                onChangePackEnabled(

                  event.target.checked

                )

              }

            />

            อนุญาตให้ขายยกแพ็ก
</label>

          {packEnabled && (
<>
<label className="manager-label">

                ราคาขายต่อแพ็ก
</label>
<input

                className="manager-input"

                type="number"

                min="0"

                step="0.01"

                value={packPrice}

                onChange={(event) =>

                  onChangePackPrice(

                    event.target.value

                  )

                }

              />
<small>

                1 แพ็ก ={" "}

                {safePackQty}{" "}

                ชิ้น / ขวด
</small>
</>

          )}
</>

      )}
</div>

  );

}

export default PackSettings;
 