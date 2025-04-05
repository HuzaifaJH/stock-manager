import {
  Account,
  Category,
  Product,
  sequelize,
  SubCategory,
  Supplier,
} from "./models";

const SHOULD_SEED = true;

export async function syncDatabase() {
  try {
    console.log(sequelize.models);

    if (SHOULD_SEED) {
      await sequelize.sync({ force: true });
      await seedData();
    } else {
      await sequelize.sync({ alter: true });
    }

    console.log("Database synced successfully.");
  } catch (error) {
    console.error("Error syncing database:", error);
  }
}

async function seedData() {
  // Create a supplier
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const supplier = await Supplier.bulkCreate([
    {
      name: "Kashmir Wood industries",
      phoneNumber: "123456789",
    },
    {
      name: "M. M Anjarwala",
      phoneNumber: "123456789",
    },
    {
      name: "Poonawala",
      phoneNumber: "123456789",
    },
    {
      name: "Kalar Trading",
      phoneNumber: "123456789",
    },
    {
      name: "Anwer kalar",
      phoneNumber: "123456789",
    },
    {
      name: "Uzair Khan",
      phoneNumber: "123456789",
    },
    {
      name: "Imran khan",
      phoneNumber: "123456789",
    },
    {
      name: "Star wood",
      phoneNumber: "123456789",
    },
    {
      name: "Moiz bhai",
      phoneNumber: "123456789",
    },
    {
      name: "Kashif zk",
      phoneNumber: "123456789",
    },
    {
      name: "Bakhshi bidding",
      phoneNumber: "123456789",
    },
  ]);

  // Add Category: "Sheets"
  const sheetsCategory = await Category.create({
    name: "Sheets",
  });

  // Add Subcategories under "Sheets"
  const subcategories = [
    "LMDF",
    "Chip Board",
    "Backs Foil",
    "Backs Farmica",
    "ZRK",
  ];

  const subcategoryIds = await Promise.all(
    subcategories.map((subcategory) =>
      SubCategory.create({
        name: subcategory,
        categoryId: sheetsCategory.getDataValue("id"),
      })
    )
  );

  const productsForLMDF = [
    { name: "355", stock: 9 },
    { name: "365", stock: 14 },
    { name: "1101", stock: 6 },
    { name: "1102", stock: 13 },
    { name: "1104", stock: 12 },
    { name: "1105", stock: 5 },
    { name: "1106", stock: 9 },
    { name: "1107", stock: 8 },
    { name: "1110", stock: 15 },
    { name: "1111", stock: 0 },
    { name: "1112", stock: 5 },
    { name: "1114", stock: 0 },
    { name: "1205", stock: 5 },
    { name: "1206", stock: 8 },
    { name: "1208", stock: 2 },
    { name: "1212", stock: 0 },
    { name: "1213", stock: 0 },
    { name: "1215", stock: 0 },
    { name: "1216", stock: 14 },
    { name: "1219", stock: 0 },
    { name: "1223", stock: 14 },
    { name: "1224", stock: 10 },
    { name: "1225", stock: 7 },
    { name: "1226", stock: 0 },
    { name: "1227", stock: 0 },
    { name: "1234", stock: 22 },
    { name: "1237", stock: 0 },
    { name: "1241", stock: 0 },
    { name: "1243", stock: 21 },
    { name: "1244", stock: 0 },
    { name: "1245", stock: 0 },
    { name: "1247", stock: 8 },
    { name: "1252", stock: 3 },
    { name: "1255", stock: 0 },
    { name: "1256", stock: 0 },
    { name: "1257", stock: 0 },
    { name: "1263", stock: 0 },
    { name: "1281", stock: 7 },
    { name: "1303", stock: 0 },
    { name: "1311", stock: 0 },
    { name: "1314", stock: 0 },
    { name: "1320", stock: 9 },
    { name: "1321", stock: 19 },
    { name: "1323", stock: 8 },
    { name: "1326", stock: 8 },
    { name: "1327", stock: 0 },
    { name: "1334", stock: 2 },
    { name: "1335", stock: 6 },
    { name: "1344", stock: 0 },
    { name: "1348", stock: 0 },
    { name: "1349", stock: 0 },
    { name: "1350", stock: 0 },
    { name: "1351", stock: 0 },
    { name: "1353", stock: 0 },
    { name: "1356", stock: 0 },
    { name: "1365", stock: 10 },
    { name: "1366", stock: 0 },
    { name: "1369", stock: 0 },
    { name: "1387", stock: 3 },
    { name: "1388", stock: 9 },
    { name: "1391", stock: 3 },
    { name: "1392", stock: 0 },
    { name: "1404", stock: 14 },
    { name: "1405", stock: 5 },
    { name: "1406", stock: 0 },
    { name: "1419", stock: 0 },
    { name: "1431", stock: 11 },
    { name: "1432", stock: 5 },
    { name: "1433", stock: 10 },
    { name: "1440", stock: 9 },
    { name: "1447", stock: 10 },
    { name: "1450", stock: 0 },
    { name: "1462", stock: 0 },
    { name: "1484", stock: 0 },
    { name: "1485", stock: 0 },
    { name: "1500", stock: 10 },
    { name: "1501", stock: 0 },
    { name: "1502", stock: 10 },
    { name: "1503", stock: 0 },
    { name: "1504", stock: 0 },
    { name: "1505", stock: 0 },
    { name: "1506", stock: 0 },
    { name: "1507", stock: 17 },
    { name: "1508", stock: 10 },
    { name: "1510", stock: 0 },
    { name: "1511", stock: 12 },
    { name: "1512", stock: 10 },
    { name: "1513", stock: 11 },
    { name: "1514", stock: 11 },
    { name: "1515", stock: 17 },
    { name: "1516", stock: 0 },
    { name: "1517", stock: 13 },
    { name: "1518", stock: 18 },
    { name: "1519", stock: 7 },
    { name: "1521", stock: 16 },
    { name: "1523", stock: 0 },
    { name: "1524", stock: 0 },
    { name: "1525", stock: 14 },
    { name: "1526", stock: 6 },
    { name: "1527", stock: 18 },
    { name: "1528", stock: 8 },
    { name: "1529", stock: 9 },
    { name: "1530", stock: 9 },
    { name: "1533", stock: 17 },
    { name: "1555", stock: 4 },
    { name: "1556", stock: 5 },
    { name: "1558", stock: 11 },
    { name: "1559", stock: 10 },
    { name: "1560", stock: 0 },
    { name: "1561", stock: 11 },
    { name: "1563", stock: 9 },
    { name: "1567", stock: 0 },
    { name: "1570", stock: 0 },
    { name: "1575", stock: 9 },
    { name: "1606", stock: 0 },
    { name: "1616", stock: 0 },
    { name: "1621", stock: 0 },
    { name: "1623", stock: 0 },
    { name: "1638", stock: 0 },
    { name: "1662", stock: 0 },
    { name: "1670", stock: 0 },
    { name: "1671", stock: 0 },
    { name: "7723", stock: 0 },
    { name: "8004", stock: 9 },
    { name: "8005", stock: 6 },
    { name: "9933", stock: 0 },
    { name: "9935", stock: 6 },
    { name: "1321 yellow", stock: 3 },
    { name: "369", stock: 22 },
  ];

  const productsForBacksFoil = [
    { name: "1226", stock: 2 },
    { name: "1105", stock: 2 },
    { name: "1237", stock: 1 },
    { name: "1224", stock: 3 },
  ];

  const productsForChipBoard = [
    { name: "1349/6064", stock: 0 },
    { name: "1212/6015", stock: 0 },
    { name: "1431", stock: 8 },
    { name: "8821/1662/6012", stock: 0 },
    { name: "1327/5479", stock: 0 },
    { name: "1080", stock: 0 },
    { name: "1405/6011", stock: 9 },
    { name: "1513/5477", stock: 20 },
    { name: "8819/1263", stock: 0 },
    { name: "1226/6051", stock: 6 },
    { name: "1326", stock: 20 },
    { name: "1102/1021", stock: 17 },
    { name: "1225/6038", stock: 10 },
    { name: "1223/6043", stock: 8 },
    { name: "1283/1245", stock: 0 },
    { name: "1215", stock: 0 },
    { name: "1321/5518", stock: 9 },
    { name: "1237/6066", stock: 3 },
    { name: "1219", stock: 0 },
    { name: "1257", stock: 0 },
    { name: "1106/1089/1088", stock: 17 },
    { name: "1224/6065", stock: 12 },
    { name: "Sada", stock: 0 },
    { name: "5475/1511", stock: 10 },
    { name: "1107/1015/1016", stock: 11 },
    { name: "1323/5519", stock: 3 },
    { name: "1105/1036", stock: 15 },
    { name: "1227/6039", stock: 9 },
    { name: "1234/6049", stock: 9 },
    { name: "6023", stock: 0 },
    { name: "1112/1079", stock: 17 },
    { name: "1110/1001-A", stock: 11 },
    { name: "1084", stock: 0 },
    { name: "1078", stock: 0 },
    { name: "1404/6083", stock: 10 },
    { name: "2053/1216", stock: 8 },
    { name: "1480/1356", stock: 0 },
    { name: "5521/1320", stock: 5 },
    { name: "1618/1334", stock: 20 },
    { name: "1616/6021", stock: 0 },
    { name: "1418/1311", stock: 0 },
    { name: "5499/1351", stock: 0 },
    { name: "6153/1206", stock: 8 },
    { name: "1265/1365", stock: 5 },
    { name: "1243/6009", stock: 9 },
    { name: "6022/1525", stock: 3 },
    { name: "1432/5511", stock: 15 },
    { name: "1391", stock: 3 },
    { name: "1205/6028", stock: 14 },
    { name: "1001/1101", stock: 12 },
    { name: "1482/1244", stock: 0 },
    { name: "1458/1348", stock: 0 },
    { name: "1114", stock: 18 },
    { name: "1104/1003", stock: 9 },
    { name: "1281/6181", stock: 10 },
    { name: "1387/6033", stock: 16 },
    { name: "1388", stock: 6 },
    { name: "1406/1634/5520", stock: 0 },
    { name: "1433/5512", stock: 19 },
    { name: "1208/1251", stock: 5 },
    { name: "1255/1637", stock: 0 },
    { name: "1247/6013", stock: 10 },
    { name: "1335/5409", stock: 15 },
    { name: "1512/5476", stock: 12 },
    { name: "1252/6076", stock: 8 },
    { name: "1256/1290", stock: 0 },
    { name: "1303", stock: 0 },
    { name: "1314", stock: 0 },
    { name: "1353/1481", stock: 0 },
    { name: "1514/6030", stock: 12 },
    { name: "1500/6183", stock: 6 },
    { name: "5514", stock: 0 },
    { name: "6033", stock: 0 },
    { name: "6024", stock: 1 },
    { name: "1575/6026", stock: 3 },
    { name: "5494", stock: 0 },
    { name: "1507", stock: 14 },
    { name: "1506", stock: 0 },
    { name: "1401", stock: 0 },
    { name: "1523", stock: 0 },
    { name: "1111/1082", stock: 6 },
    { name: "1508/5530", stock: 10 },
    { name: "1571", stock: 0 },
    { name: "1573", stock: 0 },
    { name: "1044", stock: 3 },
    { name: "6158/1561", stock: 7 },
    { name: "1083", stock: 0 },
    { name: "1447", stock: 6 },
    { name: "5513", stock: 0 },
    { name: "6168", stock: 0 },
    { name: "6025/1559", stock: 6 },
    { name: "6175/1563", stock: 1 },
    { name: "1086", stock: 0 },
    { name: "1517", stock: 0 },
    { name: "1519", stock: 1 },
    { name: "1502", stock: 10 },
    { name: "1518/6189", stock: 11 },
    { name: "6031", stock: 2 },
    { name: "6184", stock: 0 },
    { name: "1515", stock: 6 },
    { name: "1555", stock: 3 },
    { name: "1558", stock: 6 },
    { name: "1526", stock: 0 },
    { name: "1533", stock: 4 },
  ];

  const productsForZRK = [
    { name: "10MM", stock: 0 },
    { name: "6.5MM", stock: 9 },
    { name: "3.2MM", stock: 13 },
    { name: "2.2MM", stock: 15 },
    { name: "16MM", stock: 4 },
    { name: "17MM", stock: 0 },
    { name: "9MM", stock: 0 },
    { name: "6.5MM white D/S", stock: 5 },
    { name: "6.5MM white S/S", stock: 6 },
    { name: "6.5MM Ash white D/S", stock: 4 },
    { name: "6.5MM Ash white S/S", stock: 2 },
    { name: "Ply 5/6/8MM Aman", stock: 7 },
    { name: "Ply 10/12MM Aman", stock: 8 },
    { name: "Ply 16MM Aman", stock: 5 },
  ];

  const productsForBacksFarmica = [
    { name: "1110", stock: 9 },
    { name: "1213", stock: 0 },
    { name: "1320", stock: 6 },
    { name: "1105", stock: 4 },
    { name: "1106", stock: 7 },
    { name: "1303", stock: 0 },
    { name: "1356", stock: 0 },
    { name: "1406", stock: 0 },
    { name: "1244", stock: 0 },
    { name: "1510", stock: 0 },
    { name: "1351", stock: 0 },
    { name: "1348", stock: 0 },
    { name: "1392", stock: 1 },
    { name: "1353", stock: 0 },
    { name: "1616", stock: 0 },
    { name: "1671", stock: 0 },
    { name: "1661", stock: 0 },
    { name: "1107", stock: 5 },
    { name: "1621", stock: 0 },
    { name: "1623", stock: 0 },
    { name: "1432", stock: 6 },
    { name: "1255", stock: 0 },
    { name: "1672", stock: 0 },
    { name: "1224", stock: 5 },
    { name: "1101", stock: 15 },
    { name: "1662", stock: 0 },
    { name: "1512", stock: 10 },
    { name: "1102", stock: 11 },
    { name: "1431", stock: 3 },
    { name: "1311", stock: 0 },
    { name: "1326", stock: 6 },
    { name: "1391", stock: 7 },
    { name: "1388", stock: 2 },
    { name: "1670", stock: 0 },
    { name: "1387", stock: 5 },
    { name: "1365", stock: 5 },
    { name: "1281", stock: 5 },
    { name: "1111", stock: 5 },
    { name: "1514", stock: 10 },
    { name: "1247", stock: 3 },
    { name: "1252", stock: 7 },
    { name: "1314", stock: 0 },
    { name: "1335", stock: 6 },
    { name: "1216", stock: 6 },
    { name: "1112", stock: 1 },
    { name: "1206", stock: 6 },
    { name: "1104", stock: 3 },
    { name: "1321", stock: 5 },
    { name: "1225", stock: 5 },
    { name: "1500", stock: 4 },
    { name: "1508", stock: 9 },
    { name: "1447", stock: 6 },
    { name: "1525", stock: 5 },
    { name: "1440", stock: 7 },
    { name: "1433", stock: 4 },
    { name: "1044", stock: 4 },
    { name: "1080", stock: 3 },
    { name: "1083", stock: 0 },
    { name: "1208", stock: 2 },
    { name: "1219", stock: 0 },
    { name: "1513", stock: 7 },
    { name: "1561", stock: 5 },
    { name: "6182", stock: 1 },
    { name: "1555", stock: 3 },
    { name: "1517", stock: 10 },
    { name: "1518", stock: 5 },
    { name: "1507", stock: 4 },
    { name: "1519", stock: 1 },
    { name: "1529", stock: 5 },
    { name: "1526", stock: 6 },
    { name: "1527", stock: 5 },
    { name: "1558", stock: 8 },
    { name: "6168", stock: 0 },
    { name: "1559", stock: 9 },
    { name: "5513", stock: 1 },
    { name: "1323", stock: 5 },
    { name: "1212", stock: 0 },
    { name: "1506", stock: 1 },
    { name: "1515", stock: 4 },
    { name: "1521", stock: 9 },
    { name: "1405", stock: 3 },
    { name: "1223", stock: 5 },
    { name: "1243", stock: 4 },
    { name: "1511", stock: 7 },
    { name: "1404", stock: 3 },
    { name: "1334", stock: 3 },
    { name: "1205", stock: 4 },
    { name: "6021", stock: 1 },
    { name: "1563", stock: 5 },
    { name: "6169", stock: 2 },
    { name: "1227", stock: 7 },
    { name: "1349", stock: 2 },
    { name: "1086", stock: 3 },
    { name: "1502", stock: 8 },
    { name: "1237", stock: 5 },
    { name: "1257", stock: 2 },
    { name: "1528", stock: 6 },
    { name: "1234", stock: 4 },
    { name: "1226", stock: 3 },
    { name: "1530", stock: 6 },
    { name: "1533", stock: 4 },
    { name: "1556", stock: 4 },
    { name: "1114", stock: 3 },
    { name: "1575", stock: 9 },
    { name: "365", stock: 5 },
    { name: "8005", stock: 4 },
    { name: "8004", stock: 3 },
    { name: "355", stock: 2 },
  ];

  // Helper function to add products
  const addProducts = async (
    subcategoryName: string,
    products: { name: string; stock: number }[]
  ) => {
    const subcategory = subcategoryIds.find(
      (sub) => sub.getDataValue("name") === subcategoryName
    );
    if (!subcategory) {
      console.error(`Subcategory ${subcategoryName} not found`);
      return;
    }

    await Promise.all(
      products.map((product) =>
        Product.create({
          name: product.name,
          stock: product.stock,
          categoryId: sheetsCategory.getDataValue("id"),
          subCategoryId: subcategory.getDataValue("id"),
        })
      )
    );
  };

  await addProducts("LMDF", productsForLMDF);
  await addProducts("Backs Foil", productsForBacksFoil);
  await addProducts("Chip Board", productsForChipBoard);
  await addProducts("ARK", productsForZRK);
  await addProducts("Backs Farmica", productsForBacksFarmica);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const accounts = await Account.bulkCreate([
    // Assets
    { id: 1, name: "Cash", type: "Asset", code: 1001, balance: 0.0 },
    {
      id: 2,
      name: "Accounts Receivable",
      type: "Asset",
      code: 1002,
      balance: 0.0,
    },
    { id: 3, name: "Inventory", type: "Asset", code: 1003, balance: 0.0 },

    // Liabilities
    {
      id: 4,
      name: "Accounts Payable",
      type: "Liability",
      code: 2001,
      balance: 0.0,
    },
    {
      id: 5,
      name: "Loans Payable",
      type: "Liability",
      code: 2002,
      balance: 0.0,
    },

    // Equity
    { id: 6, name: "Owner's Equity", type: "Equity", code: 3001, balance: 0.0 },

    // Revenue
    { id: 7, name: "Sales Revenue", type: "Revenue", code: 4001, balance: 0.0 },
    {
      id: 8,
      name: "Service Revenue",
      type: "Revenue",
      code: 4002,
      balance: 0.0,
    },

    // Expenses
    { id: 9, name: "Rent Expense", type: "Expense", code: 5001, balance: 0.0 },
    {
      id: 10,
      name: "Utilities Expense",
      type: "Expense",
      code: 5002,
      balance: 0.0,
    },
    {
      id: 11,
      name: "Salaries Expense",
      type: "Expense",
      code: 5003,
      balance: 0.0,
    },
  ]);

  console.log("Seed data inserted successfully!");
}
