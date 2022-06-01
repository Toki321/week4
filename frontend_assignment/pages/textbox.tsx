// import { Box, TextField } from "@mui/material";
import React from "react";
import TextField from "@mui/material/TextField";
import Box from '@mui/material/Box';

export interface CustomTextBoxProp {
  value: string;
}

const TextBox = (prop: CustomTextBoxProp) => {
  return (
    <Box
    component="form"
    sx={{
      '& .MuiTextField-root': { m: 1, width: '25ch' },
    }}
    noValidate
    autoComplete="off"
  >
      <div>
      <TextField
          id="emitEvent"
          label="Emit Event"
          defaultValue={prop.value}
          InputProps={{
            readOnly: true,
          }}
          />
      </div>
  </Box>
  );
};

export default TextBox; 