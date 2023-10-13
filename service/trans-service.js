
const getAllTrans = async (req, res) => {
  try {
      const transCollection = req.db.collection('trans-reqw10');
      const trans = await transCollection.find().toArray();

      res.status(200).json({
          message: 'Transfers successfully retrieved',
          data: trans,
      });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};

const createTrans = async (req, res) => {
  const { username, transfer, nominal, status } = req.body;

  console.log(username, transfer, nominal, status, '<=== trans ===>');

  try {
      const transCollection = req.db.collection('trans-reqw10');
      const newTrans = await transCollection.insertOne({ username, transfer, nominal, status });

      res.status(200).json({
          message: 'Transfer request successfully created',
          data: newTrans,
      });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};

const approvalTrans = async (req, res) => {
  const { id, status } = req.body;

  console.log(id, status, '<=== trans ===>');

  try {
      const transCollection = req.db.collection('trans-reqw10');
      const updatedTrans = await transCollection.updateOne(
          { _id: ObjectId(id) }, // MongoDB's default ObjectId is used as assumed
          { $set: { status } }
      );

      if (updatedTrans.matchedCount === 0) {
          // Transfer request not found
          res.status(404).json({ error: 'Transfer request not found' });
          return;
      }

      res.status(200).json({
          message: 'Transfer request status successfully updated',
          data: updatedTrans,
      });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllTrans,
  createTrans,
  approvalTrans,
};
