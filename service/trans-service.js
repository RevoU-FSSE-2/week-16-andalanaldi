const { ObjectId } = require('mongodb');
const { JWT_SIGN } = require('../config/jwt');
const { verify } = require('jsonwebtoken');
const jwt = require("jsonwebtoken")

async function createTrans(req, res) {
  const { username, transfer, nominal, status } = req.body;
  const accessToken = req.cookies.access_token;
  console.log(username, transfer, nominal, status, '<=== trans ===>');
  try {
      const decodedToken = jwt.verify(accessToken, JWT_SIGN);
      const currentUser = decodedToken.username;
      //   const transCollection = req.db.collection('trans-reqrw1016');
      const existingTrans = await req.transCollection.findOne({ username: currentUser, transfer, nominal, status });
      
      if (existingTrans) {
         res.status(409).json({
             message: 'Transfer request already created for this user',
             sucess: false,
         });
         return;
      }
      const newTrans = await req.transsCollection.insertOne({
        username: currentUser,
        transfer,
        nominal,
        status
    });

    res.status(201).json({
        message: 'Successfully added transfer request',
        data: newTrans,
        success: true,
    });
  } catch (error) {
    console.error(error);

    res.status(error.status || 500).json({
        message: error.message || 'Internal Server Error',
        success: false,
    });
  }
};

async function getAllTrans(req, res) {
    const accessToken = req.cookies.access_token

    try {
        if (!JWT_SIGN) throw new Error("JWT_SIGN is not defined");

        const accessTokenPayload = verify(accessToken, JWT_SIGN);

        let query = { username: accessTokenPayload.username }

        if (
            accessTokenPayload.role === "maker" ||
            accessTokenPayload.role === "approver"
          ) {
            query = {};
          }

        // const transCollection = req.db.collection('trans-reqrw1016');
        const trans = await req.transCollection.find(query).toArray();
        if (!trans) {
            return ({
                status: 404,
                message: "Transfer requests are not found",
                success: false,
              });
            }
            return res.status(200).json({
                success: true,
                message: 'Transfers successfully retrieved',
                data: trans,
            });
    } catch (error) {
        throw {
            status: error.status || 500,
            message: error.message || "Internal Server Error",
            success: false,
        }
    }
};

async function approvalTrans(req, res) {
  const id = req.params.id
  const { username, status } = req.body;
  const token = req.cookies.access_token;
  console.log(id, status, '<=== trans ===>');

  try {
    const isValidObjectId = ObjectId.isValid(id);

    if (!isValidObjectId) {
        res.status(400).json({
            message: 'Invalid ObjectId in the URL',
            success: false
        });
        return;
      }
      const decodedToken = jwt.verify(token, JWT_SIGN);
      console.log('Decoded Token:', decodedToken);
      const currentUser = decodedToken.username;
      const userRole = decodedToken.role;
      
      const getTrans = await req.transCollection.findOne(
        { _id: new ObjectId(id) }, // MongoDB's default ObjectId is used as assumed
      );

      if (!getTrans) {
        res.status(401).json({
            message: "Unauthorized: Transaction request is not found or does not belong to the current maker"
        });
        return;
      }

      if (userRole === "approver" && getTrans.username !== currentUser) {
        res.status(401).json({
            message: "Unauthorized: You are not the maker of this transaction request"
        });
        return;
    }

      //   const transCollection = req.db.collection('trans-reqw10');
      const updatedTrans = await req.transCollection.updateOne(
          { _id: new ObjectId(id) }, // MongoDB's default ObjectId is used as assumed
          {
            $set: {
                username,
                status,
            }
        }
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
    console.error(error);
    
    if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
            message: 'Unauthorized: Invalid token',
            success: false
        });
    } else if (error.name === 'TokenExpiredError') {
        res.status(401).json({
            message: 'Unauthorized: Token expired',
            success: false
        });
    } else {
        res.status(500).json({
            message: 'Internal Server Error',
            error: error.message
        });
    }
  }
};

async function deleteTrans(req, res) {
    const { id } = req.params;
    const token = req.cookies.access_token

try {
    const decodedToken = jwt.verify(token, JWT_SIGN)
    const currentUser = decodedToken.username;
    const userRole = decodedToken.role;

    const getTrans = await req.transCollection.findOne({ _id: new ObjectId(id) })

    if ( !getTrans) {
        res.status(401).json({
            message: "Unauthorized: Transaction request is not found or does not belong to the current maker"
        })
    }

    if (userRole === "maker", "approver" && getTrans.username !== currentUser) {
        res.status(401).json({
            message: "Unauthorized: You are not the maker of this transaction request"
        });
        return;
    }

    const trans = await req.transCollection.findOneAndUpdate(
        { _id: new ObjectId(id)},
        {
            $set: {
                is_deleted: true,
            }
        }
    );
    res.status(200).json({
        message: "successfully deleted"
    })
} catch (error) {
    console.error(error);

    if (error.name === 'JsonWebTokenError') {
        res.status(401).json({
            message: 'Unauthorized: Invalid token',
            success: false
        });
    } else if (error.name === 'TokenExpiredError') {
        res.status(401).json({
            message: 'Unauthorized: Token expired',
            success: false
        });
    } else {
        res.status(500).json({
            message: 'Internal Server Error',
            error: error.message
        });
    }
}
}

module.exports = {
  getAllTrans,
  createTrans,
  approvalTrans,
  deleteTrans
};
