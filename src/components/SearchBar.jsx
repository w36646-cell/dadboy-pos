function SearchBar({ value, onChange }) {

  return (
<input

      className="search-input"

      type="search"

      value={value}

      onChange={(event) => onChange(event.target.value)}

      placeholder="ค้นหาสินค้า..."

      autoComplete="off"

    />

  );

}

export default SearchBar;
 