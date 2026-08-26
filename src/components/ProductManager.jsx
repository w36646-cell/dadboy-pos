import {

  useEffect,

  useMemo,

  useRef,

  useState,

} from "react";

import PackSettings from "./product/PackSettings";

import {

  saveCloudProduct,

  updateProductSortOrders,

} from "../services/productService";


function parseProductImageSettings(value) {

  const defaults = {

    src: "",

    scale: 1,

    x: 0,

    y: 0,

  };

  if (!value) {

    return defaults;

  }

  if (

    typeof value !== "string" ||

    !value.trim().startsWith("{")

  ) {

    return {

      ...defaults,

      src: String(value || ""),

    };

  }

  try {

    const parsed = JSON.parse(value);

    return {

      src: String(parsed.src || ""),

      scale: Number(parsed.scale || 1),

      x: Number(parsed.x || 0),

      y: Number(parsed.y || 0),

    };

  } catch {

    return {

      ...defaults,

      src: value,

    };

  }

}


function serializeProductImageSettings(

  src,

  scale,

  x,

  y

) {

  if (!src) {

    return "";

  }

  return JSON.stringify({

    src,

    scale: Number(scale || 1),

    x: Number(x || 0),

    y: Number(y || 0),

  });

}


function createEmptyForm() {

  return {

    name: "",

    category: "",

    price: 0,

    cost: 0,

    image: "",

    imageScale: 1,

    imageX: 0,

    imageY: 0,

    minStock: 5,

    trackStock: true,

    hasOption: false,

    normalPrice: 0,

    cupPrice: 25,

    cupExtraCost: 4,

    ownCupPrice: 20,

    ownCupExtraCost: 2,

    packQty: 1,

    packEnabled: false,

    packPrice: 0,

  };

}


function ProductManager({

  products,

  inventory,

  onSaveProduct,

  onClose,

}) {

  const [

    search,

    setSearch,

  ] = useState("");

  const searchInputRef =

    useRef(null);

  const [

    orderedProducts,

    setOrderedProducts,

  ] = useState(products);

  const dragProductIdRef =

    useRef(null);

  const dragTimerRef =

    useRef(null);

  const draggingRef =

    useRef(false);

  const dragRowRef =

  useRef(null);

const dragStartYRef =

  useRef(0);

const dragOverProductIdRef =

  useRef(null);
 
  const orderedProductsRef =

    useRef(products);

  const [

    editingProduct,

    setEditingProduct,

  ] = useState(null);

  const [

    isCreating,

    setIsCreating,

  ] = useState(false);

  const [

    saving,

    setSaving,

  ] = useState(false);

  const [

    form,

    setForm,

  ] = useState(

    createEmptyForm()

  );

  const editorRef =

    useRef(null);

  const productTableScrollRef =

  useRef(null);


const productStickyScrollRef =

  useRef(null);

  function syncFromProductTable(

  event

) {

  const sticky =

    productStickyScrollRef.current;

  if (!sticky) {

    return;

  }

  if (

    Math.abs(

      sticky.scrollLeft -

      event.currentTarget.scrollLeft

    ) > 1

  ) {

    sticky.scrollLeft =

      event.currentTarget.scrollLeft;

  }

}


function syncFromStickyHeader(

  event

) {

  const table =

    productTableScrollRef.current;

  if (!table) {

    return;

  }

  if (

    Math.abs(

      table.scrollLeft -

      event.currentTarget.scrollLeft

    ) > 1

  ) {

    table.scrollLeft =

      event.currentTarget.scrollLeft;

  }

}

  useEffect(() => {

    if (

      !draggingRef.current

    ) {

      setOrderedProducts(

        products

      );

      orderedProductsRef.current =

        products;

    }

  }, [products]);


  const list =

    useMemo(() => {

      const keyword =

        search

          .trim()

          .toLowerCase();

      if (!keyword) {

        return orderedProducts;

      }

      return orderedProducts.filter(

        (product) =>

          String(

            product.name || ""

          )

            .toLowerCase()

            .includes(

              keyword

            )

      );

    }, [

      orderedProducts,

      search,

    ]);


  function cancelProductDragTimer() {

    if (

      dragTimerRef.current

    ) {

      window.clearTimeout(

        dragTimerRef.current

      );

      dragTimerRef.current =

        null;

    }

  }


  function startProductDrag(

  product,

  event

) {

  if (search.trim()) {

    return;

  }

  if (

    event.target.closest(

      "button, input, select, textarea"

    )

  ) {

    return;

  }

  cancelProductDragTimer();

  const pointerId =

    event.pointerId;

  const handle =

    event.currentTarget;

  const row =

    handle.closest(

      "tr[data-product-id]"

    );

  if (!row) {

    return;

  }

  dragTimerRef.current =

    window.setTimeout(

      () => {

        dragProductIdRef.current =
product.id;

        dragOverProductIdRef.current =
product.id;

        draggingRef.current =

          true;

        dragRowRef.current =

          row;

        dragStartYRef.current =

          event.clientY;

        row.dataset.dragging =

          "true";

        row.style.position =

          "relative";

        row.style.zIndex =

          "20";

        row.style.willChange =

          "transform";

        try {

          handle.setPointerCapture?.(

            pointerId

          );

        } catch {

          // ไม่ต้องทำอะไร

        }

        if (

          typeof navigator !==

            "undefined" &&

          typeof navigator.vibrate ===

            "function"

        ) {

          navigator.vibrate(30);

        }

      },

      350

    );

}

 function moveProductDrag(

  event

) {

  if (

    !draggingRef.current ||

    dragProductIdRef.current ==

      null

  ) {

    return;

  }

  event.preventDefault();

  const draggedId =

    String(

      dragProductIdRef.current

    );

  const dragRow =

    dragRowRef.current;

  if (dragRow) {

    const deltaY =

      event.clientY -

      dragStartYRef.current;

    dragRow.style.transform =

      `translateY(${deltaY}px) scale(1.015)`;

  }

  /*

    เลื่อนหน้าจออัตโนมัติ

    เมื่อลากใกล้ขอบบน/ล่าง

  */

  const edge = 100;

  if (

    event.clientY <

    edge

  ) {

    window.scrollBy({

      top: -14,

      behavior: "auto",

    });

  } else if (

    event.clientY >

    window.innerHeight -

      edge

  ) {

    window.scrollBy({

      top: 14,

      behavior: "auto",

    });

  }

  /*

    หาแถวที่นิ้วกำลังอยู่เหนือ

  */

  const elements =

    document.elementsFromPoint(

      event.clientX,

      event.clientY

    );

  let overRow = null;

  for (

    const element of

    elements

  ) {

    const candidate =

      element.closest?.(

        "tr[data-product-id]"

      );

    if (!candidate) {

      continue;

    }

    const candidateId =

      candidate.getAttribute(

        "data-product-id"

      );

    if (

      candidateId &&

      candidateId !==

        draggedId

    ) {

      overRow =

        candidate;

      break;

    }

  }

  document

    .querySelectorAll(

      'tr[data-drag-over="true"]'

    )

    .forEach((row) => {

      delete row.dataset

        .dragOver;

    });

  if (!overRow) {

    return;

  }

  const overId =

    overRow.getAttribute(

      "data-product-id"

    );

  if (!overId) {

    return;

  }

  dragOverProductIdRef.current =

    overId;

  overRow.dataset.dragOver =

    "true";

}
 
 async function finishProductDrag(

  event

) {

  cancelProductDragTimer();

  if (

    !draggingRef.current

  ) {

    return;

  }

  const draggedId =

    String(

      dragProductIdRef.current

    );

  const overId =

    String(

      dragOverProductIdRef.current ||

      draggedId

    );

  const dragRow =

    dragRowRef.current;

  if (dragRow) {

    dragRow.style.transform =

      "";

    dragRow.style.position =

      "";

    dragRow.style.zIndex =

      "";

    dragRow.style.willChange =

      "";

    delete dragRow.dataset

      .dragging;

  }

  document

    .querySelectorAll(

      'tr[data-drag-over="true"]'

    )

    .forEach((row) => {

      delete row.dataset

        .dragOver;

    });

  draggingRef.current =

    false;

  dragProductIdRef.current =

    null;

  dragOverProductIdRef.current =

    null;

  dragRowRef.current =

    null;

  const next = [

    ...orderedProductsRef.current,

  ];

  const fromIndex =

    next.findIndex(

      (product) =>

        String(
product.id

        ) ===

        draggedId

    );

  const toIndex =

    next.findIndex(

      (product) =>

        String(
product.id

        ) ===

        overId

    );

  if (

    fromIndex >= 0 &&

    toIndex >= 0 &&

    fromIndex !==

      toIndex

  ) {

    const [moved] =

      next.splice(

        fromIndex,

        1

      );

    next.splice(

      toIndex,

      0,

      moved

    );

  }

  setOrderedProducts(

    next

  );

  orderedProductsRef.current =

    next;

  try {

    const updatedOrder =

      await updateProductSortOrders(

        next

      );

    setOrderedProducts(

      updatedOrder

    );

    orderedProductsRef.current =

      updatedOrder;

  } catch (error) {

    console.error(

      "Save product order error:",

      error

    );

    window.alert(

      "บันทึกลำดับสินค้าไม่สำเร็จ"

    );

  }

}

function cancelProductDrag() {

  cancelProductDragTimer();

  const dragRow =

    dragRowRef.current;

  if (dragRow) {

    dragRow.style.transform =

      "";

    dragRow.style.position =

      "";

    dragRow.style.zIndex =

      "";

    dragRow.style.willChange =

      "";

    delete dragRow.dataset

      .dragging;

  }

  document

    .querySelectorAll(

      'tr[data-drag-over="true"]'

    )

    .forEach((row) => {

      delete row.dataset

        .dragOver;

    });

  dragProductIdRef.current =

    null;

  dragOverProductIdRef.current =

    null;

  dragRowRef.current =

    null;

  draggingRef.current =

    false;

}
 
  function scrollToEditor() {

    window.setTimeout(

      () => {

        editorRef.current

          ?.scrollIntoView({

            behavior: "smooth",

            block: "start",

          });

      },

      60

    );

  }

  function openCreate() {

    /*

      ใช้ timestamp เป็น ID ใหม่

      ไม่ชนกับสินค้าเดิม

    */

    const newId =

      Date.now();

    setEditingProduct({

      id: newId,

    });

    setIsCreating(

      true

    );

    setForm(

      createEmptyForm()

    );

    scrollToEditor();

  }

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

    const imageSettings =

      parseProductImageSettings(

        product.image

      );

    setEditingProduct(

      product

    );

    setIsCreating(

      false

    );

    setForm({

      name:

        product.name || "",

      category:

        product.category ||

        "",

      price:

        Number(

          product.price ||

            0

        ),

      cost:

        Number(

          product.cost ||

            0

        ),

      image:

        imageSettings.src,

      imageScale:

        imageSettings.scale,

      imageX:

        imageSettings.x,

      imageY:

        imageSettings.y,

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

      cupExtraCost:

        Number(

          cupOption?.extraCost ??

            4

        ),

      ownCupPrice:

        Number(

          ownCupOption?.price ??

            20

        ),

      ownCupExtraCost:

        Number(

          ownCupOption?.extraCost ??

            2

        ),

      packQty:
 
        Math.max(

          1,

          Number(

            product.packQty ??

              1

          ) || 1

        ),

      packEnabled:

        product.packEnabled ===

        true,

      packPrice:

        Math.max(

          0,

          Number(

            product.packPrice ??

              0

          ) || 0

        ),

    });

    scrollToEditor();

  }

  function closeEditor() {

    setEditingProduct(

      null

    );

    setIsCreating(

      false

    );

    setForm(

      createEmptyForm()

    );

  }

  function updateField(

    field,

    value

  ) {

    setForm(

      (current) => ({

        ...current,

        [field]:

          value,

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

    reader.onload =

      () => {

        const source =

          String(

            reader.result

          );

        const image =

          new Image();

        image.onload =

          () => {

            const canvas =

              document.createElement(

                "canvas"

              );

            const size =

              512;

            canvas.width =

              size;

            canvas.height =

              size;

            const context =

              canvas.getContext(

                "2d"

              );

            if (!context) {

              return;

            }

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

              (size -

                width) /

              2;

            const y =

              (size -

                height) /

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

                0.92

              )

            );

            updateField(

              "imageScale",

              1

            );

            updateField(

              "imageX",

              0

            );

            updateField(

              "imageY",

              0

            );

          };

        image.src =

          source;

      };

    reader.readAsDataURL(

      file

    );

  }

  function buildProduct() {

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

    const packQty =

      Math.max(

        1,

        Math.floor(

          Number(

            form.packQty

          ) || 1

        )

      );

    const packEnabled =

      Boolean(

        form.packEnabled

      );

    const packPrice =

      Math.max(

        0,

        Number(

          form.packPrice

        ) || 0

      );

    const product = {

      ...editingProduct,

      name:

        form.name.trim(),

      category:

        form.category.trim(),

      price:

        normalPrice,

      cost,

      image:

        serializeProductImageSettings(

          form.image,

          form.imageScale,

          form.imageX,

          form.imageY

        ),

      minStock,

      trackStock:

        Boolean(

          form.trackStock

        ),

      hasOption:

        Boolean(

          form.hasOption

        ),

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

                extraCost: 0,

              },

                {

                id:

                  "cup",

                name:

                  "ใส่แก้ว",

                price:

                  Math.max(

                    0,

                    Number(

                      form.cupPrice

                    ) || 0

                  ),

                extraCost:

                  Math.max(

                    0,

                    Number(

                      form.cupExtraCost

                    ) || 0

                  ),

              },

                {

                id:

                  "ownCup",

                name:

                  "เอาแก้วมาเอง",

                price:

                  Math.max(

                    0,

                    Number(

                      form.ownCupPrice

                    ) || 0

                  ),

                extraCost:

                  Math.max(

                    0,

                    Number(

                      form.ownCupExtraCost

                    ) || 0

                  ),

              },

            ]

          : [],

      packQty,

      packEnabled,

      packPrice:

        packEnabled

          ? packPrice

          : 0,

    };

    delete product

      .hasOptions;

    return product;

  }

  async function saveProduct() {

    if (

      !editingProduct ||

      saving

    ) {

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

    const packQty =

      Math.max(

        1,

        Math.floor(

          Number(

            form.packQty

          ) || 1

        )

      );

    const packEnabled =

      Boolean(

        form.packEnabled

      );

    const packPrice =

      Math.max(

        0,

        Number(

          form.packPrice

        ) || 0

      );

    if (

      packEnabled &&

      packQty < 2

    ) {

      window.alert(

        "ถ้าจะเปิดขายยกแพ็ก ต้องกำหนดจำนวนต่อแพ็กอย่างน้อย 2 ชิ้น"

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

    const updatedProduct =

      buildProduct();

    setSaving(

      true

    );

    try {

      /*

        =========================

        เพิ่มสินค้าใหม่

        =========================

        เพิ่มตรงเข้า Supabase

        Stock เริ่มต้น = 0

        หลังบันทึกเสร็จ

        Reload แอป

        ระบบจะโหลด Product

        จาก Supabase ใหม่

      */

      if (

        isCreating

      ) {

        if (

          typeof navigator !==

            "undefined" &&

          navigator.onLine ===

            false

        ) {

          window.alert(

            "การเพิ่มสินค้าใหม่ต้องเชื่อมต่ออินเทอร์เน็ตก่อน"

          );

          return;

        }

        await saveCloudProduct(

          updatedProduct,

          0

        );

        window.alert(

          "เพิ่มสินค้าเรียบร้อย\nStock เริ่มต้นเป็น 0"

        );

        window.location.reload();

        return;

      }

      /*

        =========================

        แก้ไขสินค้าเดิม

        =========================

      */

      await onSaveProduct(

        updatedProduct

      );

      closeEditor();

      window.alert(

        "บันทึกสินค้าเรียบร้อย"

      );

    } catch (error) {

  console.error("Save product error:", error);

  const errorName = error?.name || "UnknownError";

  const errorMessage = error?.message || String(error);

  window.alert(

    "บันทึกสินค้าไม่สำเร็จ\n\n" +

    "Error: " + errorName + "\n" +

    "Message: " + errorMessage

  );

} finally {
 

      setSaving(

        false

      );

    }

  }

  return (
<div className="product-manager">
<div className="manager-header management">
 
<div>
<h1>

            จัดการสินค้า
</h1>
<p>

            เพิ่มสินค้า แก้ชื่อ ราคา ต้นทุน รูป

            การติดตามสต๊อก และข้อมูลแพ็ก
</p>
</div>
<div

          style={{

            display:

              "flex",

            alignItems:

              "center",

            gap:

              "8px",

            flexWrap:

              "wrap",

          }}
>
<button

            className="manager-save-button"

            type="button"

            onClick={

              openCreate

            }

            style={{

              minHeight:

                "42px",

              padding:

                "10px 18px",

              fontWeight:

                "800",

            }}
>

            + เพิ่มสินค้า
</button>
<button

            className="stock-close-button"

            type="button"

            onClick={() => {

  window.location.reload();

}}
 
>

            กลับหน้าขาย
</button>
</div>
</div>
<div

  style={{

    position: "relative",

    width: "100%",

    maxWidth: "520px",

    margin: "18px 0",

  }}
>
<input

    ref={searchInputRef}

    className="search-input"

    type="search"

    placeholder="ค้นหาสินค้า..."

    value={search}

    onChange={(event) =>

      setSearch(event.target.value)

    }

    style={{

      width: "100%",

      maxWidth: "none",

      margin: 0,

      paddingRight: "52px",

    }}

  />

  {search && (
<button

      type="button"

      aria-label="ล้างคำค้นหา"

      onPointerDown={(event) => {

        event.preventDefault();

      }}

      onClick={() => {

        setSearch("");

        requestAnimationFrame(() => {

          searchInputRef.current?.focus();

        });

      }}

      style={{

        position: "absolute",

        top: "50%",

        right: "10px",

        transform: "translateY(-50%)",

        width: "36px",

        height: "36px",

        padding: 0,

        border: 0,

        borderRadius: "50%",

        background: "transparent",

        color: "#777",

        fontSize: "28px",

        fontWeight: "400",

        lineHeight: 1,

        cursor: "pointer",

      }}
>

      ×
</button>

  )}
</div>
  
<div className="product-manager-layout">
<div className="product-table-column">
<div

  className="product-table-sticky-wrap"

  ref={productStickyScrollRef}

  onScroll={syncFromStickyHeader}
>
<table className="product-table product-manager-sync-table">
<thead>
 
<tr>
<th

  style={{

    width: "44px",

    textAlign: "center",

  }}
>

  ลาก
</th>
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

  บรรจุ/แพ็ก
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
</table>
</div>

<div

  className="product-table-wrap"

  ref={productTableScrollRef}

  onScroll={syncFromProductTable}
>
<table className="product-table product-manager-sync-table">
<thead className="sticky-table-header">
 
<tr>
<th

  style={{

    width: "44px",

    textAlign: "center",

  }}
>

  ลาก
</th>
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

                  บรรจุ/แพ็ก
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

                      ] ?? 0

                    );

                  const normalPrice =

                    item.options?.find(

                      (

                        option

                      ) =>
option.id ===

                        "normal"

                    )?.price ??

                    item.price;

                  const cost =

                    Number(

                      item.cost ||

                        0

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

                  const packQty =

                    Math.max(

                      1,

                      Number(

                        item.packQty ??

                          1

                      ) || 1

                    );

                  const packEnabled =

                    item.packEnabled ===

                    true;

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

  key={item.id}

  data-product-id={
item.id

  }

  onClick={() => {

    if (

      draggingRef.current

    ) {

      return;

    }

    openEdit(item);

  }}
>
 
<td

  onClick={(event) => {

    event.stopPropagation();

  }}

  onPointerDown={(event) => {

    event.stopPropagation();

    startProductDrag(

      item,

      event

    );

  }}

  onPointerMove={(event) => {

    event.stopPropagation();

    moveProductDrag(

      event

    );

  }}

  onPointerUp={(event) => {

    event.stopPropagation();

    finishProductDrag(

      event

    );

  }}

  onPointerCancel={(event) => {

    event.stopPropagation();

    cancelProductDrag();

  }}

  onPointerLeave={() => {

    if (

      !draggingRef.current

    ) {

      cancelProductDragTimer();

    }

  }}

  style={{

    width: "44px",

    minWidth: "44px",

    textAlign: "center",

    fontSize: "22px",

    color: "#667085",

    cursor: "grab",

    touchAction: "none",

    userSelect: "none",

    WebkitUserSelect: "none",

    WebkitTouchCallout: "none",

  }}
>

  ☰
</td>
   
 <td>
<div className="manager-image-box">

                          {parseProductImageSettings(

                            item.image

                          ).src ? (
<img

                              src={

                                parseProductImageSettings(

                                  item.image

                                ).src

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

                        {Number(

                          normalPrice ||

                            0

                        ).toLocaleString()}{" "}

                        บาท
</td>
<td>

                        {packQty >=

                        2

                          ? `${packQty} ชิ้น`

                          : "-"}
</td>
<td>

                        {packEnabled

                          ? `${packPrice.toLocaleString()} บาท`

                          : packQty >=

                            2

                          ? "ไม่เปิดขายแพ็ก"

                          : "-"}
</td>
<td>

                        {cost.toLocaleString()}{" "}

                        บาท
</td>
<td

                        className={

                          isLow

                            ? "stock-negative"

                            : ""

                        }
>

                        {

                          stock

                        }
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

                          onClick={(

                            event

                          ) => {

                            event.stopPropagation();

                            openEdit(

                              item

                            );

                          }}
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
  
</div>
<aside

ref={editorRef}

className="product-edit-panel"

style={{

  position: "relative",

}}
>

          {editingProduct && (
<button

    type="button"

    aria-label="ปิดหน้าต่างแก้ไขสินค้า"

    onClick={() => {

      const currentId =

        !isCreating

          ? editingProduct?.id

          : null;

      closeEditor();

      if (!currentId) {

        return;

      }

      requestAnimationFrame(() => {

        const currentRow =

          document.querySelector(

            `tr[data-product-id="${currentId}"]`

          );

        const nextRow =

          currentRow?.nextElementSibling;

        if (nextRow) {

          nextRow.scrollIntoView({

            behavior: "smooth",

            block: "start",

          });

        } else {

          currentRow?.scrollIntoView({

            behavior: "smooth",

            block: "start",

          });

        }

      });

    }}

    style={{

      position: "absolute",

      top: "10px",

      right: "10px",

      width: "38px",

      height: "38px",

      padding: 0,

      border: "none",

      borderRadius: "50%",

      background: "#e5e7eb",

      color: "#475467",

      fontSize: "24px",

      fontWeight: "700",

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      cursor: "pointer",

      zIndex: 10,

    }}
>

    ×
</button>

)}

          {!editingProduct ? (
 
<div className="product-edit-empty">

              กด “+ เพิ่มสินค้า”

              หรือเลือกสินค้าที่ต้องการแก้ไข
</div>

          ) : (
<>
<h2>

                {isCreating

                  ? "เพิ่มสินค้าใหม่"

                  : "แก้ไขสินค้า"}
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

                    ต้นทุนเพิ่ม — ใส่แก้ว
</label>
<input

                    type="number"

                    min="0"

                    step="0.01"

                    value={

                      form.cupExtraCost

                    }

                    onChange={(

                      event

                    ) =>

                      updateField(

                        "cupExtraCost",

                        event.target.value

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
<label>

                    ต้นทุนเพิ่ม — เอาแก้วมาเอง
</label>
<input

                    type="number"

                    min="0"

                    step="0.01"

                    value={

                      form.ownCupExtraCost

                    }

                    onChange={(

                      event

                    ) =>

                      updateField(

                        "ownCupExtraCost",

                        event.target.value

                      )

                    }

                  />
</div>

              )}
<PackSettings

                packQty={

                  form.packQty

                }

                packEnabled={

                  form.packEnabled

                }

                packPrice={

                  form.packPrice

                }

                onChangePackQty={(

                  value

                ) =>

                  updateField(

                    "packQty",

                    value

                  )

                }

                onChangePackEnabled={(

                  value

                ) =>

                  updateField(

                    "packEnabled",

                    value

                  )

                }

                onChangePackPrice={(

                  value

                ) =>

                  updateField(

                    "packPrice",

                    value

                  )

                }

              />
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
<div className="manager-preview manager-image-editor-preview">

                {form.image ? (
<img

                    src={

                      form.image

                    }

                    alt="ตัวอย่างสินค้า"

                    style={{

                      transform:

                        `translate(${form.imageX}%, ${form.imageY}%) scale(${form.imageScale})`,

                    }}

                  />

                ) : (
<span>

                    ไม่มีรูป
</span>

                )}
</div>
<div className="manager-image-controls">
<label>
<span>

ซูมรูป
<b>

{Number(form.imageScale).toFixed(2)}x
</b>
</span>
<input

type="range"

min="0.5"

max="3"

step="0.05"

value={form.imageScale}

onChange={(event) =>

  updateField(

    "imageScale",

    Number(event.target.value)

  )

}

/>
</label>
<label>
<span>

เลื่อนรูป ซ้าย / ขวา
<b>

{form.imageX}%
</b>
</span>
<input

type="range"

min="-60"

max="60"

step="1"

value={form.imageX}

onChange={(event) =>

  updateField(

    "imageX",

    Number(event.target.value)

  )

}

/>
</label>
<label>
<span>

เลื่อนรูป ขึ้น / ลง
<b>

{form.imageY}%
</b>
</span>
<input

type="range"

min="-60"

max="60"

step="1"

value={form.imageY}

onChange={(event) =>

  updateField(

    "imageY",

    Number(event.target.value)

  )

}

/>
</label>
<button

type="button"

className="manager-image-reset"

onClick={() => {

  updateField(

    "imageScale",

    1

  );

  updateField(

    "imageX",

    0

  );

  updateField(

    "imageY",

    0

  );

}}
>

รีเซ็ตรูป
</button>
</div>

              {isCreating && (
<div

                  style={{

                    marginTop:

                      "10px",

                    padding:

                      "10px",

                    borderRadius:

                      "8px",

                    background:

                      "#f2f4f7",

                    color:

                      "#475467",

                    fontSize:

                      "12px",

                    lineHeight:

                      "1.5",

                  }}
>

                  สินค้าใหม่จะเริ่ม Stock ที่ 0

                  หลังจากเพิ่มแล้วสามารถเข้า

                  “รับสินค้าเข้า”

                  เพื่อเพิ่มจำนวนสต๊อกได้
</div>

              )}
<div className="manager-actions">
<button

                  className="manager-cancel-button"

                  type="button"

                  onClick={

                    closeEditor

                  }

                  disabled={

                    saving

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

                  disabled={

                    saving

                  }
>

                  {saving

                    ? "กำลังบันทึก..."

                    : isCreating

                    ? "เพิ่มสินค้า"

                    : "บันทึก"}
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
