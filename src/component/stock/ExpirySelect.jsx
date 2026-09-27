import { formatQuantity } from '../utils/units';
import { formatDate } from '../utils/date';

// Optional expiry note picker used at out entry. Selected note is deducted on transfer and erased at 0.
const ExpirySelect = ({ className, options = [], value, onChange, disabled }) => {
  if (!options.length) {
    return <small style={{ color: '#999' }}>No expiry note</small>;
  }

  return (
    <select
      className={className}
      value={value || ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
      disabled={disabled}
    >
      <option value="">None</option>
      {options.map(expiry => (
        <option key={expiry.expiryId} value={expiry.expiryId}>
          {formatDate(expiry.expiryDate)} | Rack {expiry.rackId || '-'} | Qty {formatQuantity(expiry.quantity, expiry.quantityUnit)}
        </option>
      ))}
    </select>
  );
};

export default ExpirySelect;
