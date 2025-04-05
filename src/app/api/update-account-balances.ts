import Account from "@/lib/models/Account";

const updateAccountBalances = async (journalEntries: any, transaction: any) => {
  console.log("updateAccountBalances function called", journalEntries);

  for (const entry of journalEntries) {
    console.log("Processing entry:", entry);

    // Fetch the account by ID
    const account = await Account.findByPk(entry.accountId, { transaction });
    let id = account ? account.getDataValue("id") : null;
    let name = account ? account.getDataValue("name") : null;
    let balance = account ? account.getDataValue("balance") : null;

    if (account) {
      // Convert balance and amount to numbers before calculation
      let currentBalance = parseFloat(balance);
      let amount = parseFloat(entry.amount as any);

      console.log(
        `Before update - Account ID: ${id}, Name: ${name}, Balance: ${currentBalance}`
      );

      if (entry.type === "Debit") {
        currentBalance += amount;
        console.log(`Debited Rs.${amount} to ${name}`);
      } else if (entry.type === "Credit") {
        currentBalance -= amount;
        console.log(`Credited Rs.${amount} from ${name}`);
      }

      // Assign back the calculated value
      balance = currentBalance;
      await account.save({ transaction });

      console.log(
        `After update - Account ID: ${id}, Name: ${name}, New Balance: ${balance}`
      );
    }
  }
};

export default updateAccountBalances;
