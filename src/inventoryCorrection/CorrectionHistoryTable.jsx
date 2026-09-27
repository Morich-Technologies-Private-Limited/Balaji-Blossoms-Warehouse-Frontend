import { History } from 'lucide-react';
import styles from './InventoryCorrection.module.css';
import { UNIT_LABEL, formatQuantity } from '../component/utils/units';
import { formatDate } from '../component/utils/date';

// Audit trail of direct inventory corrections
const CorrectionHistoryTable = ({ logs }) => (
  <table className={styles.table}>
    <thead>
      <tr>
        <th>Date</th>
        <th>Item Name</th>
        <th>Packing</th>
        <th>Old Qty</th>
        <th>New Qty</th>
        <th>Difference</th>
        <th>Corrected By</th>
        <th>Remark</th>
      </tr>
    </thead>
    <tbody>
      {logs.length ? logs.map(log => (
        <tr key={log.id}>
          <td>{formatDate(log.correctedAt)}</td>
          <td>{log.productName}</td>
          <td>{log.packingSize} {UNIT_LABEL[log.packingUnit]}</td>
          <td>{formatQuantity(log.oldQuantity, log.packingUnit)}</td>
          <td>{formatQuantity(log.newQuantity, log.packingUnit)}</td>
          <td className={log.difference >= 0 ? styles.positive : styles.negative}>
            {log.difference > 0 ? '+' : ''}{formatQuantity(log.difference, log.packingUnit)}
          </td>
          <td>{log.correctedBy}</td>
          <td>{log.remark || '-'}</td>
        </tr>
      )) : (
        <tr>
          <td colSpan={8} className={styles.emptyRow}>
            <History size={36} />
            <p>No corrections yet.</p>
          </td>
        </tr>
      )}
    </tbody>
  </table>
);

export default CorrectionHistoryTable;
