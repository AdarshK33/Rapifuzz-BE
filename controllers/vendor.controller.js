const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const Vendor = require("../models/vendor.model");
const fs = require("fs");
const PDFDocument = require("pdfkit-table"); 
const excel = require('exceljs');
let Validator = require('validatorjs');
const ErrorHandler = require("../utils/errorHandler");
const bcrypt = require('bcryptjs')
const User = require("../models/user.model");


// Create and Save a new Vendors
exports.create = catchAsyncErrors(async (req, res, next)=> {
    // Validate request
    if (!req.body) {
      res.status(400).send({
        message: "Content can not be empty!"
      });
    }

    // Create a Vendor
    const vendor = new Vendor({
        vendor_id: req.body.vendor_id,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        state: req.body.state,
        city: req.body.city,
        address: req.body.address,
        account_type: req.body.account_type,
        licensedate: req.body.licensedate,
        gst_number: req.body.gst_number,
        contactperson: req.body.contactperson,
        status: req.body.status || "In Active"
    });

    let validation = new Validator(req.body,{
      vendor_id : 'required',
      name : 'required',
      email : ['required', 'email'],
      phone : ['required', 'integer', 'digits:10'],
      state: 'required',
      city: 'required',
      address: 'required',
      contactperson: 'required',
      licensedate : ['date', 'regex:/^((?:([1-9][0-9]{3}-[0-9]{2}-[0-9]{2})))$/'],
      gst_number : ['required'],
      account_type :  ['required', { 'in': ['Permanent', 'Temporary'] }]
    });

    const checkEmail = await User.findByEmail(req.body.email)
    if(checkEmail){
      return next(new ErrorHandler("Sorry! given email is already taken", 400))
    }
   
  
    validation.checkAsync(null, ()=>{
      const errObj = validation.errors.all()
      let errMsg = []
      for (const errProp in errObj) {
        return next(new ErrorHandler(errObj[errProp], 400))
      }
    });
  
    // Save Vendors in the database
   const data = await  Vendor.create(vendor)

   const password = await bcrypt.hash("1234", 10)
   const user = {
     name : req.body.name,
     email : req.body.email,
     password: password,
     avatar: "",
     role: "vendor",
     vendor_dc_id: req.body.vendor_id
   }
 
   const userCreate = User.create(user);

   res.status(201).json({
     success: true,
     data
   })
})

// Retrieve all Vendors from the database (with condition).
exports.findAll = catchAsyncErrors(async (req, res, next)=> {
  
  const vendor_name = req.query.name;
  const vendor_address = req.query.address;

  const state = req.query.state
  const city = req.query.city
  const status = req.query.status

  let perPage = req.query.per_page
  let pageNumber = req.query.page_number

  if(perPage < 0 || pageNumber < 0){
    perPage = "";
    pageNumber = "";
  }

  const data = await Vendor.getAll(vendor_name,vendor_address, state, city, status, perPage, pageNumber);

  res.status(200).json({
    status: true,
    data
  })
})

exports.getLogedinVendorDetail = catchAsyncErrors(async (req, res, next)=> {
  const vendor_id = req.user.vendor_dc_id

  const vendor = await Vendor.getSingleVendorByVendorId(vendor_id)

  res.status(200).json({
    status: true,
    vendor
  })
})

exports.updateVendor = catchAsyncErrors(async (req, res, next)=> {
 
  const vendor_id = req.params.vendor_id
  const vendor_data = await Vendor.getSingleVendorByVendorId(vendor_id)

  if(!vendor_data){
    return next(new ErrorHandler(`The entered Vendor is invalid`, 400))
  }
 
  const {name, email, phone, address, state, city, account_type, gst_number, contactperson, status, ...rest} = req.body
  const other = Object.keys(rest)
  other.map(e => {
    return next(new ErrorHandler(`Please remove unwanted fields ${e} from request body`, 400))
  })

  
  let validation = new Validator(req.body,{
      name : 'required',
      email : ['required', 'email'],
      phone : ['required', 'integer', 'digits:10'],
      state: 'required',
      city: 'required',
      address: 'required',
      contactperson: 'required',
      gst_number : ['required'],
      account_type :  ['required', { 'in': ['Permanent', 'Temporary'] }]
  });

  validation.checkAsync(null, ()=>{
    const errObj = validation.errors.all()
    let errMsg = []
    for (const errProp in errObj) {
      return next(new ErrorHandler(errObj[errProp], 400))
    }
  });

  const vendor = await Vendor.updateVendor(req.body, vendor_id)

  res.status(201).json({
    success: true,
    vendor
  })
})

exports.getVendorByVendorId = catchAsyncErrors(async (req, res, next)=> {
  const vendor_id = req.params.vendor_id

  const vendor = await Vendor.getSingleVendorByVendorId(vendor_id)
  
  res.status(200).json({
    status: true,
    vendor
  })
})

exports.getAllStateAndCity = catchAsyncErrors(async (req, res, next)=> {
  
  //const vendor = await Vendor.getAllStateAndCity()
  // const vendor_cust = vendor.reduce((t, cv, ci)=>{
  //   var ia = false
  //   var index = -1
  //   t.map((item, i) => {
  //     if(item.state == cv.state) {
  //       ia = true
  //       index = i
  //     }
  //   })
  //   if(ia) {
  //     t[index].cities.push(cv.city)
  //   } else {
  //     t.push({
  //       state: cv.state,
  //       cities: [cv.city]
  //     })
  //   }
  //   return t
  // },[])

  const state = await Vendor.getAllState();
  const city = await Vendor.getAllCity();
  
  res.status(200).json({
    status: true,
    state,
    city
  })
})

exports.downloadPDF = catchAsyncErrors(async (req,res, next)=>{
  const vendor_name = req.query.name;
  const vendor_address = req.query.address;

  const state = req.query.state
  const city = req.query.city
  const status = req.query.status

  let perPage = req.query.per_page
  let pageNumber = req.query.page_number

  if(perPage < 0 || pageNumber < 0){
    perPage = "";
    pageNumber = "";
  }

  const vendor = await Vendor.getAll(vendor_name,vendor_address, state, city, status, perPage, pageNumber);

  const rest = vendor.map(e=> {
   
    let date = new Date(e.modifiedAt);
    let last_modified = new Date(date.getTime() - (date.getTimezoneOffset() * 60000 ))
                    .toISOString()
                    .split("T")[0];
    Object.assign(e, {last_modified})

    return e
  })

  let doc = new PDFDocument({compress:false, margin: 30, size: 'A4' });
  // file name
  doc.pipe(fs.createWriteStream("./resources/static/assets/download/vendor.pdf"));

  const table = {
    title: "Vendor Table",
    headers: [
      { label:"Vendor ID", property: 'vendor_id', width: 70, renderer: null }, 
      { label:"Name", property: 'name', width: 70, renderer: null }, 
      { label:"Account Type", property: 'account_type', width: 70, renderer: null }, 
      { label:"GST Number", property: 'gst_number', width: 70, renderer: null }, 
      { label:"Active Orders", property: 'active_orders', width: 70, renderer: null }, 
      { label:"Contact Person", property: 'contactperson', width: 80, renderer: null },  
      { label:"Last Updated", property: 'last_modified', width: 60, renderer: null }, 
      { label:"Status", property: 'status', width: 40, renderer: null }, 
    ],
    // complex data
    datas: rest,
  };

  await doc.table(table, {
    prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
    prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
      doc.font("Helvetica").fontSize(8);
      indexColumn === 0 && doc.addBackground(rectRow, 'white', 0.15);
    },
  });

 
  // rest of the code goes here...
  doc.end();

  doc.pipe(res)
})

exports.downloadExcel = catchAsyncErrors(async (req,res, next)=>{
  const vendor_name = req.query.name;
  const vendor_address = req.query.address;

  const state = req.query.state
  const city = req.query.city
  const status = req.query.status

  let perPage = req.query.per_page
  let pageNumber = req.query.page_number

  if(perPage < 0 || pageNumber < 0){
    perPage = "";
    pageNumber = "";
  }

  const vendor = await Vendor.getAll(vendor_name,vendor_address, state, city, status, perPage, pageNumber);

  const rest = vendor.map(e=> {
   
    let date = new Date(e.modifiedAt);
    let last_modified = new Date(date.getTime() - (date.getTimezoneOffset() * 60000 ))
                    .toISOString()
                    .split("T")[0];
    Object.assign(e, {last_modified})

    return e
  })

  let workbook = new excel.Workbook(); //creating workbook
	let worksheet = workbook.addWorksheet('Vendor Table'); //creating worksheet

  //  WorkSheet Header
  worksheet.columns = [
    { header:"Vendor ID", key: 'vendor_id', width: 20}, 
    { header:"Name", key: 'name', width: 20}, 
    { header:"Account Type", key: 'account_type', width: 20}, 
    { header:"GST Number", key: 'gst_number', width: 20}, 
    { header:"Active Orders", key: 'active_orders', width: 20}, 
    { header:"Contact Person", key: 'contactperson', width: 20},  
    { header:"Last Updated", key: 'last_modified', width: 20}, 
    { header:"Status", key: 'status', width: 20}
  ];

  worksheet.addRows(rest);

  // Write to File
  await workbook.xlsx.writeFile("./resources/static/assets/download/vendor.xlsx")
  .then(function() {
  });

  res.status(200).download("./resources/static/assets/download/vendor.xlsx")
})