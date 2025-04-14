// src/components/ItemSearch.tsx
import React, { useState, useMemo, ChangeEvent } from 'react' // Import ChangeEvent
import { useItemData } from '@/context/ItemDataContext'
import type { Equipment } from '@/utils/types' // Import the item type

// Define the component using React.FC (Functional Component) or standard function syntax
const ItemSearch: React.FC = () => {
  const { allItems, isLoading, error } = useItemData() // Types inferred from hook

  // Use generics for state types
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [maxResults, setMaxResults] = useState<number>(20)

  // Type the parameters and return value for useMemo's callback
  const filteredItems = useMemo<Equipment[]>(() => {
    if (!searchTerm) {
      return allItems.slice(0, maxResults)
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase()

    // item is now typed as OsrsItem within filter/map
    return allItems
      .filter(item =>
        item?.name.toLowerCase().includes(lowerCaseSearchTerm)
      )
      .slice(0, maxResults)

  }, [allItems, searchTerm, maxResults])

  // Type the event handler's event parameter
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const handleMaxResultsChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10)
    setMaxResults(Math.max(1, isNaN(value) ? 10 : value)) // Handle NaN safely
  }

  // --- Render Logic ---
  if (isLoading) {
    return <div>Loading item data...</div>
  }

  // Error object now has a 'message' property guaranteed by the Error type
  if (error) {
    return <div style={{ color: 'red' }}>Error loading item data: {error.message}</div>
  }

  return (
    <div>
      <h2>OSRS Weapon/Armor Search</h2>
      <input
        type="text"
        placeholder="Search by name..."
        value={searchTerm}
        onChange={handleSearchChange} // Use typed handler
        style={{ marginBottom: '10px', padding: '8px', width: '300px' }}
      />
      <label style={{ marginLeft: '10px' }}>
        Max Results:
        <input
          type="number"
          value={maxResults}
          onChange={handleMaxResultsChange} // Use typed handler
          min="1"
          style={{ width: '60px', marginLeft: '5px' }}
        />
      </label>

      {filteredItems.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {/* item is typed as OsrsItem here */}
          {filteredItems.map((item) => (
            <li key={item.stats?.id} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>
              {/* Use optional chaining if properties might be missing */}
              <strong>{item.name}</strong> (ID: {item.stats?.id})
              {item.stats?.slot && <span> - Slot: {item.stats?.slot}</span>}
              {/* Accessing item.equipment?.attack_stab etc. is now type-safe */}
            </li>
          ))}
        </ul>
      ) : (
        <p>{searchTerm ? 'No items match your search.' : 'Enter a search term to see items.'}</p>
      )}
      {/* Check name existence using optional chaining ?. */}
      {searchTerm && allItems.filter(item => item.name?.toLowerCase().includes(searchTerm.toLowerCase())).length > maxResults && (
        <p style={{ color: 'grey' }}>More results available, refine your search or increase max results...</p>
      )}
    </div>
  )
}

export default ItemSearch