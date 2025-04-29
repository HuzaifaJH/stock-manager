// import AccountGroup from "@/lib/models/AccountGroup";
// import { Transaction } from "sequelize";

// interface JournalEntries {
//   ledgerId: number;
//   amount: number;
//   type: string;
// }

// const updateAccountBalances = async (
//   journalEntries: JournalEntries[],
//   transaction: Transaction
// ) => {
//   console.log("updateAccountBalances function called", journalEntries);

//   for (const entry of journalEntries) {
//     console.log("Processing entry:", entry);

//     // Fetch the account by ID
//     const account = await AccountGroup.findByPk(entry.ledgerId, {
//       transaction,
//     });
//     const id = account ? account.getDataValue("id") : null;
//     const name = account ? account.getDataValue("name") : null;
//     let balance = account ? account.getDataValue("balance") : null;

//     if (account) {
//       // Convert balance and amount to numbers before calculation
//       let currentBalance = parseFloat(balance);
//       const amount = parseFloat(entry.amount.toString());

//       console.log(
//         `Before update - Account ID: ${id}, Name: ${name}, Balance: ${currentBalance}`
//       );

//       if (entry.type === "Debit") {
//         currentBalance += amount;
//         console.log(`Debited Rs.${amount} to ${name}`);
//       } else if (entry.type === "Credit") {
//         currentBalance -= amount;
//         console.log(`Credited Rs.${amount} from ${name}`);
//       }

//       // Assign back the calculated value
//       balance = currentBalance;
//       await account.save({ transaction });

//       console.log(
//         `After update - Account ID: ${id}, Name: ${name}, New Balance: ${balance}`
//       );
//     }
//   }
// };

// export default updateAccountBalances;
