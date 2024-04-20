const { ObjectId } = require("mongodb");
class MuonSachService {
  constructor(client) {
    this.MuonSach = client.db().collection("TheoDoiMuonSach");
  }
  extractMuonSachData(payload) {
    const muonsach = {
      maDocGia: payload.maDocGia,
      tenDocGia: payload.tenDocGia,
      maSach: payload.maSach,
      tenSach: payload.tenSach,
      ngayMuon: payload.ngayMuon,
      ngayTra: payload.ngayTra,
      trangThai: payload.trangThai,
    };
    Object.keys(muonsach).forEach(
      (key) => muonsach[key] === undefined && delete muonsach[key]
    );
    return muonsach;
  }
  async register(payload) {
    const muonsach = this.extractMuonSachData(payload);
    const result = await this.MuonSach.findOneAndUpdate(
      muonsach,
      { $set: muonsach },
      {
        returnDocument: "after",
        upsert: true,
      }
    );
    console.log(result);
    return result;
  }
  async find(filter) {
    const cursor = await this.MuonSach.find(filter);
    return await cursor.toArray();
  }
  async findByName(tenDocGia) {
    return await this.find({
      tenDocGia: { $regex: new RegExp(tenDocGia), $options: "i" },
    });
  }
  async findById(id) {
    return await this.MuonSach.findOne({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    });
  }
  async update(id, payload) {
    const filter = {
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    };
    const update = this.extractMuonSachData(payload);
    const result = await this.MuonSach.findOneAndUpdate(
      filter,
      { $set: update },
      { returnDocument: "after" }
    );
    return result.value;
  }
  async delete(id) {
    const result = await this.MuonSach.findOneAndDelete({
      _id: ObjectId.isValid(id) ? new ObjectId(id) : null,
    });
    return result.value;
  }
async borrowBook(req, res) {
  try {
    const { maDocGia, tenDocGia, maSach, tenSach, ngayMuon, ngayTra } = req.body;

    // Kiểm tra số lượng sách
    const book = await BookService.get(maSach);
    if (book.soQuyen > 0) {
      const borrowData = {
        maDocGia,
        tenDocGia,
        maSach,
        tenSach,
        ngayMuon,
        ngayTra,
        trangThai: "Đã mượn", // Thiết lập trạng thái của sách là đã mượn
      };

      // Ghi nhận thông tin mượn sách vào cơ sở dữ liệu
      const result = await MuonSachService.register(borrowData);

      // Giảm số lượng sách sau khi mượn thành công
      await BookService.updateQuantity(maSach);

      return res.status(200).json({ message: "Đã mượn sách thành công.", data: result });
    } else {
      return res.status(400).json({ message: "Xin lỗi, đã hết sách. Không thể mượn." });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Đã xảy ra lỗi khi mượn sách." });
  }
}

}
module.exports = MuonSachService;

