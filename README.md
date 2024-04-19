# SocialKYC

The source code of https://socialkyc.io

Copyright (c) 2021-2023, BOTLabs GmbH. All rights reserved.

## Start the app locally:

After having cloned the repository on your local machine and defining all environment variables, to start the app locally follow this steps.

1. Make sure you have all dependencies installed, running:

   ```
   yarn install
   ```

2. Enter the dev watch mode from parcel (builds as well), running:

   ```
   yarn dev
   ```

3. On a new terminal window, start the app, running:

   ```
   yarn dev-start
   ```

   Now you can see the logs of the backend on the terminal and visit the frontend under the URL specified by the variable `URL` from the `.env`-file.
   (By default http://localhost:3000)
