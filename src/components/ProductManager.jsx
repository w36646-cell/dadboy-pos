import { useMemo, useState } from "react";

function ProductManager({

  products,

  inventory,

  onSaveProduct,

  onClose,

}) {

  const [search, setSearch] =

    useState("");

  const [

    editingProduct,

    setEditingProduct,

  ] = useState(null);

  const [form, setForm] =

    useState({

      name: "",

      category: "",

      price: 0,

      cost: 0,

      image: "",

      minStock: 5,

      trackStock: true,

      hasOption: false,

      normalPrice: 0,

      cupPrice: 25,

      ownCupPrice: 20,

      /*

        ==========================

        ขายยกแพ็ก

        ==========================

      */

      packEnabled: false,

      packQty: 1,

      packPrice: 0,

    });

  const list =

    useMemo(() => {

      const keyword =

        search

          .trim()

          .toLowerCase();

      if (!keyword) {

        return products;

      }

      return products.filter(

        (product) =>

          product.name

            .toLowerCase()

            .includes(keyword)

      );

    }, [

      products,

      search,

    ]);

  function openEdit(

    product

  ) {

    const normalOption =

      product.options?.find(

        (option) =>
option.id ===

          "normal"

      );

    const cupOption =

      product.options?.find(

        (option) =>
option.id ===

          "cup"

      );

    const ownCupOption =

      product.options?.find(

        (option) =>
option.id ===

          "ownCup"

      );

    const hasOption =

      product.hasOption ===

        true ||

      product.hasOptions ===

        true;

    setEditingProduct(

      product

    );

    setForm({

      name:

        product.name || "",

      category:

        product.category ||

        "",

      price:

        Number(

          product.price || 0

        ),

      cost:

        Number(

          product.cost || 0

        ),

      image:

        product.image || "",

      minStock:

        Number(

          product.minStock ??

            5

        ),

      trackStock:

        product.trackStock !==

        false,

      hasOption,

      normalPrice:

        Number(

          normalOption?.price ??

            product.price ??

            0

        ),

      cupPrice:

        Number(

          cupOption?.price ??

            25

        ),

      ownCupPrice:

        Number(

          ownCupOption?.price ??

            20

        ),

      /*

        ==========================

        ค่าแพ็กเดิม

        ==========================

      */

      packEnabled:

        product.packEnabled ===

        true,

      packQty:

        Math.max(

          1,

          Number(

            product.packQty ??

              1

          ) || 1

        ),

      packPrice:

        Math.max(

          0,

          Number(

            product.packPrice ??

              0

          ) || 0

        ),

    });

  }

  function updateField(

    field,

    value

  ) {

    setForm(

      (current) => ({

        ...current,

        [field]: value,

      })

    );

  }

  function handleImageFile(

    event

  ) {

    const file =

      event.target

        .files?.[0];

    if (!file) {

      return;

    }

    const reader =

      new FileReader();

    reader.onload = () => {

      const source =

        String(

          reader.result

        );

      const image =

        new Image();

      image.onload = () => {

        const canvas =

          document.createElement(

            "canvas"

          );

        const size = 512;

        canvas.width =

          size;

        canvas.height =

          size;

        const context =

          canvas.getContext(

            "2d"

          );

        context.fillStyle =

          "#ffffff";

        context.fillRect(

          0,

          0,

          size,

          size

        );

        const scale =

          Math.min(

            400 /

              image.width,

            400 /

              image.height

          );

        const width =

          image.width *

          scale;

        const height =

          image.height *

          scale;

        const x =

          (size - width) /

          2;

        const y =

          (size - height) /

          2;

        context.drawImage(

          image,

          x,

          y,

          width,

          height

        );

        updateField(

          "image",

          canvas.toDataURL(

            "image/jpeg",

            0.82

          )

        );

      };

      image.src =

        source;

    };

    reader.readAsDataURL(

      file

    );

  }

  function saveProduct() {

    if (!editingProduct) {

      return;

    }

    if (

      !form.name.trim()

    ) {

      window.alert(

        "กรุณาใส่ชื่อสินค้า"

      );

      return;

    }

    const normalPrice =

      Math.max(

        0,

        Number(

          form.hasOption

            ? form.normalPrice

            : form.price

        ) || 0

      );

    const cost =

      Math.max(

        0,

        Number(

          form.cost

        ) || 0

      );

    const minStock =

      Math.max(

        0,

        Number(

          form.minStock

        ) || 0

      );

    const packEnabled =

      Boolean(

        form.packEnabled

      );

    const packQty =

      Math.max(

        1,

        Math.floor(

          Number(

            form.packQty

          ) || 1

        )

      );

    const packPrice =

      Math.max(

        0,

        Number(

          form.packPrice

        ) || 0

      );

    /*

      ถ้าเปิดขายแพ็ก

      ต้องมีอย่างน้อย 2 ชิ้น

      และต้องมีราคาแพ็กมากกว่า 0

    */

    if (

      packEnabled &&

      packQty < 2

    ) {

      window.alert(

        "จำนวนชิ้นต่อแพ็กต้องตั้งแต่ 2 ชิ้นขึ้นไป"

      );

      return;

    }

    if (

      packEnabled &&

      packPrice <= 0

    ) {

      window.alert(

        "กรุณาใส่ราคาขายต่อแพ็ก"

      );

      return;

    }

    const updatedProduct = {

      ...editingProduct,

      name:

        form.name.trim(),

      category:

        form.category.trim(),

      price:

        normalPrice,

      cost,

      image:

        form.image,

      minStock,

      trackStock:

        Boolean(

          form.trackStock

        ),

      hasOption:

        form.hasOption,

      options:

        form.hasOption

          ? [

              {

                id:

                  "normal",

                name:

                  "ปกติ",

                price:

                  normalPrice,

              },

              {

                id:

                  "cup",

                name:

                  "ใส่แก้ว",

                price:

                  Number(

                    form.cupPrice

                  ) || 0,

              },

              {

                id:

                  "ownCup",

                name:

                  "เอาแก้วมาเอง",

                price:

                  Number(

                    form.ownCupPrice

                  ) || 0,

              },

            ]

          : [],

      /*

        ==========================

        ขายยกแพ็ก

        ==========================

      */

      packEnabled,

      packQty:

        packEnabled

          ? packQty

          : 1,

      packPrice:

        packEnabled

          ? packPrice

          : 0,

    };

    delete updatedProduct

      .hasOptions;

    onSaveProduct(

      updatedProduct

    );

    setEditingProduct(

      null

    );

    window.alert(

      "บันทึกสินค้าเรียบร้อย"

    );

  }

  return (
<div className="product-manager">
<div className="manager-header">
<div>
<h1>

            จัดการสินค้า
</h1>
<p>

            แก้ชื่อ ราคา ต้นทุน รูป

            สต๊อก และราคาขายยกแพ็ก
</p>
</div>
<button

          className="stock-close-button"

          type="button"

          onClick={

            onClose

          }
>

          กลับหน้าขาย
</button>
</div>
<input

        className="search-input"

        type="search"

        placeholder="ค้นหาสินค้า..."

        value={

          search

        }

        onChange={(

          event

        ) =>

          setSearch(

            event.target

              .value

          )

        }

      />
<div className="product-manager-layout">
<div className="product-table-wrap">
<table className="product-table">
<thead>
<tr>
<th>

                  รูป
</th>
<th>

                  ชื่อสินค้า
</th>
<th>

                  ราคาขาย
</th>
<th>

                  ราคาแพ็ก
</th>
<th>

                  ต้นทุน
</th>
<th>

                  คงเหลือ
</th>
<th>

                  Min
</th>
<th>

                  Tracking
</th>
<th>

                  จัดการ
</th>
</tr>
</thead>
<tbody>

              {list.map(

                (item) => {

                  const stock =

                    Number(

                      inventory[
item.id

                      ] ?? 50

                    );

                  const normalPrice =

                    item.options?.find(

                      (option) =>
option.id ===

                        "normal"

                    )?.price ??

                    item.price;

                  const cost =

                    Number(

                      item.cost || 0

                    );

                  const minStock =

                    Number(

                      item.minStock ??

                        5

                    );

                  const trackStock =

                    item.trackStock !==

                    false;

                  const isLow =

                    trackStock &&

                    stock <=

                      minStock;

                  const packEnabled =

                    item.packEnabled ===

                    true;

                  const packQty =

                    Math.max(

                      1,

                      Number(

                        item.packQty ??

                          1

                      ) || 1

                    );

                  const packPrice =

                    Math.max(

                      0,

                      Number(

                        item.packPrice ??

                          0

                      ) || 0

                    );

                  return (
<tr

                      key={
item.id

                      }
>
<td>
<div className="manager-image-box">

                          {item.image ? (
<img

                              src={

                                item.image

                              }

                              alt={

                                item.name

                              }

                            />

                          ) : (
<span>

                              ไม่มีรูป
</span>

                          )}
</div>
</td>
<td>

                        {

                          item.name

                        }
</td>
<td>

                        {

                          normalPrice

                        }{" "}

                        บาท
</td>
<td>

                        {packEnabled ? (
<>

                            {

                              packPrice

                            }{" "}

                            บาท
<br />
<small>

                              {

                                packQty

                              }{" "}

                              ชิ้น/แพ็ก
</small>
</>

                        ) : (

                          "-"

                        )}
</td>
<td>

                        {cost} บาท
</td>
<td

                        className={

                          isLow

                            ? "stock-negative"

                            : ""

                        }
>

                        {stock}
</td>
<td>

                        {

                          minStock

                        }
</td>
<td>

                        {trackStock

                          ? "เปิด"

                          : "ปิด"}
</td>
<td>
<button

                          className="edit-product-button"

                          type="button"

                          onClick={() =>

                            openEdit(

                              item

                            )

                          }
>

                          แก้ไข
</button>
</td>
</tr>

                  );

                }

              )}
</tbody>
</table>
</div>
<aside className="product-edit-panel">

          {!editingProduct ? (
<div className="product-edit-empty">

              เลือกสินค้าที่ต้องการแก้ไข
</div>

          ) : (
<>
<h2>

                แก้ไขสินค้า
</h2>
<label className="manager-label">

                ชื่อสินค้า
</label>
<input

                className="manager-input"

                value={

                  form.name

                }

                onChange={(

                  event

                ) =>

                  updateField(

                    "name",

                    event.target

                      .value

                  )

                }

              />
<label className="manager-label">

                หมวดหมู่
</label>
<input

                className="manager-input"

                value={

                  form.category

                }

                onChange={(

                  event

                ) =>

                  updateField(

                    "category",

                    event.target

                      .value

                  )

                }

              />
<label className="manager-label">

                ต้นทุนต่อชิ้น
</label>
<input

                className="manager-input"

                type="number"

                min="0"

                step="0.01"

                value={

                  form.cost

                }

                onChange={(

                  event

                ) =>

                  updateField(

                    "cost",

                    event.target

                      .value

                  )

                }

              />

              {!form.hasOption && (
<>
<label className="manager-label">

                    ราคาขายต่อชิ้น
</label>
<input

                    className="manager-input"

                    type="number"

                    min="0"

                    step="0.01"

                    value={

                      form.price

                    }

                    onChange={(

                      event

                    ) =>

                      updateField(

                        "price",

                        event.target

                          .value

                      )

                    }

                  />
</>

              )}
<label className="manager-checkbox">
<input

                  type="checkbox"

                  checked={

                    form.hasOption

                  }

                  onChange={(

                    event

                  ) =>

                    updateField(

                      "hasOption",

                      event.target

                        .checked

                    )

                  }

                />

                มีตัวเลือกใส่แก้ว
</label>

              {form.hasOption && (
<div className="option-price-box">
<label>

                    ราคาปกติ
</label>
<input

                    type="number"

                    min="0"

                    step="0.01"

                    value={

                      form.normalPrice

                    }

                    onChange={(

                      event

                    ) =>

                      updateField(

                        "normalPrice",

                        event.target

                          .value

                      )

                    }

                  />
<label>

                    ใส่แก้ว
</label>
<input

                    type="number"

                    min="0"

                    step="0.01"

                    value={

                      form.cupPrice

                    }

                    onChange={(

                      event

                    ) =>

                      updateField(

                        "cupPrice",

                        event.target

                          .value

                      )

                    }

                  />
<label>

                    เอาแก้วมาเอง
</label>
<input

                    type="number"

                    min="0"

                    step="0.01"

                    value={

                      form.ownCupPrice

                    }

                    onChange={(

                      event

                    ) =>

                      updateField(

                        "ownCupPrice",

                        event.target

                          .value

                      )

                    }

                  />
</div>

              )}
<hr />
<h3>

                ขายยกแพ็ก
</h3>
<label className="manager-checkbox">
<input

                  type="checkbox"

                  checked={

                    form.packEnabled

                  }

                  onChange={(

                    event

                  ) =>

                    updateField(

                      "packEnabled",

                      event.target

                        .checked

                    )

                  }

                />

                สินค้านี้ขายยกแพ็กได้
</label>

              {form.packEnabled && (
<>
<label className="manager-label">

                    จำนวนชิ้นต่อ 1 แพ็ก
</label>
<input

                    className="manager-input"

                    type="number"

                    min="2"

                    step="1"

                    value={

                      form.packQty

                    }

                    onChange={(

                      event

                    ) =>

                      updateField(

                        "packQty",

                        event.target

                          .value

                      )

                    }

                  />
<label className="manager-label">

                    ราคาขายต่อ 1 แพ็ก
</label>
<input

                    className="manager-input"

                    type="number"

                    min="0"

                    step="0.01"

                    value={

                      form.packPrice

                    }

                    onChange={(

                      event

                    ) =>

                      updateField(

                        "packPrice",

                        event.target

                          .value

                      )

                    }

                  />
<small>

                    ตัวอย่าง: 6 ชิ้น/แพ็ก ราคา 95 บาท

                    ระบบ Stock จะยังนับเป็นจำนวนชิ้น
</small>
<div

                    style={{

                      marginTop:

                        "10px",

                      padding:

                        "10px 12px",

                      borderRadius:

                        "8px",

                      background:

                        "#f8fafc",

                      fontSize:

                        "13px",

                    }}
>

                    1 แพ็ก ={" "}
<strong>

                      {Math.max(

                        1,

                        Number(

                          form.packQty

                        ) || 1

                      )}{" "}

                      ชิ้น
</strong>
<br />

                    ราคาแพ็ก ={" "}
<strong>

                      {Number(

                        form.packPrice

                      ) || 0}{" "}

                      บาท
</strong>
</div>
</>

              )}
<hr />
<h3>

                การติดตามสต๊อก
</h3>
<label className="manager-checkbox">
<input

                  type="checkbox"

                  checked={

                    form.trackStock

                  }

                  onChange={(

                    event

                  ) =>

                    updateField(

                      "trackStock",

                      event.target

                        .checked

                    )

                  }

                />

                ติดตามและแจ้งเตือนสต๊อก
</label>

              {form.trackStock && (
<>
<label className="manager-label">

                    Min Stock
</label>
<input

                    className="manager-input"

                    type="number"

                    min="0"

                    step="1"

                    value={

                      form.minStock

                    }

                    onChange={(

                      event

                    ) =>

                      updateField(

                        "minStock",

                        event.target

                          .value

                      )

                    }

                  />
<small>

                    ระบบจะแจ้งเตือนเมื่อคงเหลือเท่ากับหรือต่ำกว่าจำนวนนี้
</small>
</>

              )}
<hr />
<label className="manager-label">

                ที่อยู่ไฟล์รูป
</label>
<input

                className="manager-input"

                value={

                  form.image

                }

                placeholder="/images/ชื่อรูป.png"

                onChange={(

                  event

                ) =>

                  updateField(

                    "image",

                    event.target

                      .value

                  )

                }

              />
<label className="manager-file-button">

                เลือกรูปจากเครื่อง
<input

                  type="file"

                  accept="image/*"

                  onChange={

                    handleImageFile

                  }

                />
</label>
<div className="manager-preview">

                {form.image ? (
<img

                    src={

                      form.image

                    }

                    alt="ตัวอย่างสินค้า"

                  />

                ) : (
<span>

                    ไม่มีรูป
</span>

                )}
</div>
<div className="manager-actions">
<button

                  className="manager-cancel-button"

                  type="button"

                  onClick={() =>

                    setEditingProduct(

                      null

                    )

                  }
>

                  ยกเลิก
</button>
<button

                  className="manager-save-button"

                  type="button"

                  onClick={

                    saveProduct

                  }
>

                  บันทึก
</button>
</div>
</>

          )}
</aside>
</div>
</div>

  );

}

export default ProductManager;
 