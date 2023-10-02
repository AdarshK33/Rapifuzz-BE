const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const Common = require("../models/common.model");
const ErrorHandler = require("../utils/errorHandler");
const { uniqueorder, uniqueinvoice } = require("../utils/uniqueorder");


exports.getOrderAndInvoice = catchAsyncErrors(async(req, res, next)=>{

    const order_number = await Common.getOrderNumberOrInvoice();
    // const orderno = uniqueorder()
    // const invoiceno = uniqueinvoice()
    const orderno = "O"+order_number
    const invoiceno = "I"+order_number


    res.status(200).json({
        orderno,
        invoiceno
    })

})

exports.getAllStateAndCity = catchAsyncErrors(async (req, res, next)=> {
  
    const state = await Common.getAllStateAndCity()
  
    const state_cust = state.reduce((t, cv, ci)=>{
      var ia = false
      var index = -1
      t.map((item, i) => {
        if(item.state == cv.state) {
          ia = true
          index = i
        }
      })
      if(ia) {
        t[index].cities.push(cv.city)
      } else {
        t.push({
          state: cv.state,
          cities: [cv.city]
        })
      }
      return t
    },[])
  
  
    res.status(200).json({
      status: true,
      state_city : state_cust
    })
})

exports.getAllState = catchAsyncErrors(async (req, res, next)=> {
  
  const state = await Common.getAllState()

  const states = state.map(e => e.state)

  res.status(200).json({
    status: true,
    states
  })
})

exports.getCitybyState = catchAsyncErrors(async (req, res, next)=> {
  
  const {state} = req.query

  if(!state){
    return next(new ErrorHandler('No state passed', 400))
  }

  const city = await Common.getCitiesbyState(state)

  const cities = city.map(e => e.city)

  res.status(200).json({
    status: true,
    cities
  })
})





