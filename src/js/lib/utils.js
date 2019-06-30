const getBrowser = () => {
  if (typeof chrome !== "undefined") {
    if (typeof browser !== "undefined") {
      return "Firefox";
    } else {
      return "Chrome";
    }
  } else {
    return "Edge";
  }
}

const getMdExtensionId = () => {
  if (getBrowser() == "Firefox") {
    return "{596d6a6e-ba7e-4cf5-8f88-cec08a06ef2a}";
  } else {
    return "dnclbikcihnpjohihfcmmldgkjnebgnj";
  }
}

export default {
  getBrowser,
  getMdExtensionId
}
