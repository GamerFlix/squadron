/*
 * MIT License
 * 
 * Copyright (c) 2020-2021 DnD5e Helpers Team and Contributors
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import { MODULE } from './module.js';
import { logger } from './modules/logger.js';
import { UserInterface } from './modules/user-interface.js'
import { Lookout } from './modules/lookout.js'
import { Logistics } from './modules/logistics.js'
import { api } from './modules/api.js'

( async () => {
  const SUB_MODULES = {
    MODULE,
    UserInterface,
    Lookout,
    Logistics,
    api,
    logger,
  }

  /*
  Initialize Module
  */
  await MODULE.build();

  /*
  Initialize all Sub Modules
  */
  Hooks.on(`setup`, () => {
    Object.values(SUB_MODULES).forEach(cl => cl.register());

    //GlobalTesting
    //Object.entries(SUB_MODULES).forEach(([key, cl])=> window[key] = cl);
  });
})();
