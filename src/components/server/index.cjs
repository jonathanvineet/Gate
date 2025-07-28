const path = require("path");
const express = require("express");
const { auth, resolver, protocol } = require("@iden3/js-iden3-auth");
const getRawBody = require("raw-body");
const cors = require('cors');
const app = express();
const port = 8000;
