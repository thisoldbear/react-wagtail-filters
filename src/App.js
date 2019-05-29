import React, { useEffect, useReducer } from "react";
import "./App.css";

const initialState = {
  filterType: null,
  listings: [],
  limit: 5,
  offset: 0,
  loadMore: false
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_FILTER_TYPE":
      return {
        ...state,
        filterType: action.payload
      };

    case "RESET_OFFSET":
      return {
        ...state,
        offset: initialState.offset
      };

    case "INCREMENT_OFFSET":
      return {
        ...state,
        offset: state.offset + action.payload
      };

    case "SET_LOADMORE":
      return {
        ...state,
        loadMore: action.payload
      };

    case "ADD_LISTINGS":
      return {
        ...state,
        listings: [...state.listings, ...action.payload]
      };

    case "RESET_LISTINGS":
      return {
        ...state,
        listings: initialState.listings
      };

    default:
      throw new Error();
  }
};

// String literal abuse club
const fetchListings = (type = null, limit = null, offset = null) =>
  fetch(
    `https://npr-poc.herokuapp.com/api/v2/pages/?${
      type ? `&type=${type}` : ""
    }${offset ? `&offset=${offset}` : ""}${limit ? `&limit=${limit}` : ""}
    `
  )
    .then(resp => resp.json())
    .then(resp => resp);

const handleFetchListings = async ({ filterType, limit, offset }) => {
  const {
    items,
    meta: { total_count: totalCount }
  } = await fetchListings(filterType, limit, offset);

  return { items, totalCount };
};

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  // On initial load, make request for everything
  // This would likely be a request to a "featured content" endpoint
  useEffect(() => {
    let ignore = false;

    const { filterType, limit, offset, listings } = state;

    async function fetchData() {
      const { items, totalCount } = await handleFetchListings({
        filterType,
        limit,
        offset
      });

      // If we have items
      if (!ignore && items.length) {
        dispatch({ type: "ADD_LISTINGS", payload: items });

        // If the total is more than the items returned
        if (totalCount > items.length) {
          dispatch({ type: "INCREMENT_OFFSET", payload: limit });
          dispatch({ type: "SET_LOADMORE", payload: true });
        } else if (totalCount === items.length) {
          dispatch({ type: "SET_LOADMORE", payload: false });
        }
      }
    }

    // If there are no listings
    if (listings.length === 0) {
      fetchData();
    }

    return () => {
      ignore = true;
    };
  }, [state]);

  const handleLoadMore = async () => {
    const { filterType, limit, offset, listings } = state;

    const { items, totalCount } = await handleFetchListings({
      filterType,
      limit,
      offset
    });

    // Store new items
    if (items.length) {
      dispatch({ type: "ADD_LISTINGS", payload: items });

      if (items.length < totalCount) {
        dispatch({ type: "INCREMENT_OFFSET", payload: limit });
      }

      // Moody
      if (listings.length + items.length >= totalCount) {
        dispatch({ type: "SET_LOADMORE", payload: false });
      }
    }
  };

  const handleSelectChange = value => {
    dispatch({ type: "RESET_OFFSET" });
    dispatch({ type: "RESET_LISTINGS" });
    dispatch({ type: "SET_FILTER_TYPE", payload: value });
  };

  return (
    <div className="App">
      <select onChange={e => handleSelectChange(e.target.value)}>
        <option value={""}>All</option>
        <option value="podcasts.Episode">Episodes</option>
        <option value="podcasts.Show">Shows</option>
      </select>

      {state.listings.length ? (
        state.listings.map(listing => (
          <div key={listing.id}>{listing.title}</div>
        ))
      ) : (
        <div>Loading...</div>
      )}

      <div>
        {state.loadMore && <button onClick={handleLoadMore}>Load more</button>}
      </div>
    </div>
  );
}

export default App;
