import { useMemo, useState } from "react";

function ProductPage({

  products,

  inventory,

  onSaveProduct,

  onClose,

}) {

  const [search, setSearch] = useState("");

  const [editingProduct, setEditingProduct] =

    useState(null);

  const [form, setForm] = useState({

    name: "",

    category: "",

    price: 0,

    cost: 0,

    image: "",

    hasOption: false,

    normalPrice: 0,

    cupPrice: 25,

    ownCupPrice: 20,

  });

  const list = useMemo(() => {

    const keyword = search

      .trim()

      .toLowerCase();

    if (!keyword) {

      return products;

    }

    return products.filter((product) =>

      product.name

        .toLowerCase()

        .includes(keyword)

    );

  }, [products, search]);

  function openEdit(product) {

    const normalOption =

      product.options?.find(

        (option) => option.id === "normal"

      );

    const cupOption =

      product.options?.find(

        (option) => option.id === "cup"

      );

    const ownCupOption =

      product.options?.find(

        (option) => option.id === "ownCup"

      );

    const hasOption =

      product.hasOption === true ||

      product.hasOptions === true;

    setEditingProduct(product);

    setForm({

      name: product.name || "",

      category: product.category || "",

      price: Number(product.price || 0),

      cost: Number(product.cost || 0),

      image: product.image || "",

      hasOption,

      normalPrice: Number(

        normalOption?.price ??

          product.price ??

          0

      ),

      cupPrice: Number(

        cupOption?.price ?? 25

      ),

      ownCupPrice: Number(

        ownCupOption?.price ?? 20

      ),

    });

  }

  function updateField(field, value) {

    setForm((current) => ({

      ...current,

      [field]: value,

    }));

  }

  function handleImageFile(event) {

    const file =

      event.target.files?.[0];

    if (!file) {

      return;

    }

    const reader = new FileReader();

    reader.onload = () => {

      const source = String(

        reader.result

      );

      const image = new Image();

      image.onload = () => {

        const canvas =

          document.createElement(

            "canvas"

          );

        const size = 512;

        canvas.width = size;

        canvas.height = size;

        const context =

          canvas.getContext("2d");

        context.fillStyle = "#ffffff";

        context.fillRect(

          0,

          0,

          size,

          size

        );

        const scale = Math.min(

          400 / image.width,

          400 / image.height

        );

        const width =

          image.width * scale;

        const height =

          image.height * scale;

        const x =

          (size - width) / 2;

        const y =

          (size - height) / 2;

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

      image.src = source;

    };

    reader.readAsDataURL(file);

  }

  function saveProduct() {

    if (!editingProduct) {

      return;

    }

    if (!form.name.trim()) {

      window.alert(

        "กรุณาใส่ชื่อสินค้า"

      );

      return;

    }

    const normalPrice = Number(

      form.hasOption

        ? form.normalPrice

        : form.price

    );

    const cost = Math.max(

      0,

      Number(form.cost) || 0

    );

    const updatedProduct = {

      ...editingProduct,

      name: form.name.trim(),

      category:

        form.category.trim(),

      price: normalPrice,

      cost,

      image: form.image,

      hasOption: form.hasOption,

      options: form.hasOption

        ? [

            {

              id: "normal",

              name: "ปกติ",

              price: normalPrice,

            },

            {

              id: "cup",

              name: "ใส่แก้ว",

              price: Number(

                form.cupPrice

              ),

            },

            {

              id: "ownCup",

              name:

                "เอาแก้วมาเอง",

              price: Number(

                form.ownCupPrice

              ),

            },

          ]

        : [],

    };

    delete updatedProduct.hasOptions;

    onSaveProduct(updatedProduct);

    setEditingProduct(null);

    window.alert(

      "บันทึกสินค้าเรียบร้อย"

    );

  }

  return (
<div className="product-manager">
<div className="manager-header">
<div>
<h1>จัดการสินค้า</h1>
<p>

            แก้ชื่อ ราคา ต้นทุน รูป

            และตัวเลือกสินค้า
</p>
</div>
<button

          className="stock-close-button"

          type="button"

          onClick={onClose}
>

          กลับหน้าขาย
</button>
</div>
<input

        className="search-input"

        type="search"

        placeholder="ค้นหาสินค้า..."

        value={search}

        onChange={(event) =>

          setSearch(

            event.target.value

          )

        }

      />
<div className="product-manager-layout">
<div className="product-table-wrap">
<table className="product-table">
<thead>
<tr>
<th>รูป</th>
<th>ชื่อสินค้า</th>
<th>ราคาขาย</th>
<th>ต้นทุน</th>
<th>คงเหลือ</th>
<th>จัดการ</th>
</tr>
</thead>
<tbody>

              {list.map((item) => {

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

                return (
<tr key={item.id}>
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

                      {item.name}
</td>
<td>

                      {normalPrice} บาท
</td>
<td>

                      {cost} บาท
</td>
<td

                      className={

                        stock < 0

                          ? "stock-negative"

                          : ""

                      }
>

                      {stock}
</td>
<td>
<button

                        className="edit-product-button"

                        type="button"

                        onClick={() =>

                          openEdit(item)

                        }
>

                        แก้ไข
</button>
</td>
</tr>

                );

              })}
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

                value={form.name}

                onChange={(event) =>

                  updateField(

                    "name",

                    event.target.value

                  )

                }

              />
<label className="manager-label">

                หมวดหมู่
</label>
<input

                className="manager-input"

                value={form.category}

                onChange={(event) =>

                  updateField(

                    "category",

                    event.target.value

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

                value={form.cost}

                onChange={(event) =>

                  updateField(

                    "cost",

                    event.target.value

                  )

                }

              />

              {!form.hasOption && (
<>
<label className="manager-label">

                    ราคาขาย
</label>
<input

                    className="manager-input"

                    type="number"

                    min="0"

                    step="0.01"

                    value={form.price}

                    onChange={(event) =>

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

                  onChange={(event) =>

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

                    onChange={(event) =>

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

                    onChange={(event) =>

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

                    onChange={(event) =>

                      updateField(

                        "ownCupPrice",

                        event.target

                          .value

                      )

                    }

                  />
</div>

              )}
<label className="manager-label">

                ที่อยู่ไฟล์รูป
</label>
<input

                className="manager-input"

                value={form.image}

                placeholder="/images/ชื่อรูป.png"

                onChange={(event) =>

                  updateField(

                    "image",

                    event.target.value

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

                    src={form.image}

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

export default ProductPage;
 