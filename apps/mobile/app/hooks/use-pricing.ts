/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { Subscription } from "react-native-iap";
import PremiumService from "../services/premium";
import { db } from "../common/database";

type PurchaseInfo = {
  country: string;
  countryCode: string;
  sku: string;
  discount: number;
};

const skuInfos: { [name: string]: PurchaseInfo | undefined } = {};

export const usePricing = (period: "monthly" | "yearly") => {
  const [current, setCurrent] = useState<{
    period: string;
    info?: PurchaseInfo;
    product?: Subscription;
  }>();

  const getDefaultSku = (period: "monthly" | "yearly") => {
    return period === "monthly"
      ? "com.streetwriters.notesnook.sub.mo"
      : "com.streetwriters.notesnook.sub.yr";
  };

  useEffect(() => {
    (async () => {
      const skuInfo =
        skuInfos[period] ||
        (await db.pricing?.sku(
          Platform.OS === "android" ? "android" : "ios",
          period
        ));
      skuInfos[period] = skuInfo;
      const products = (await PremiumService.getProducts()) as Subscription[];
      let product = products.find((p) => p.productId === skuInfo?.sku);
      if (!product)
        product = products.find((p) => p.productId === getDefaultSku(period));
      setCurrent({
        info: skuInfo,
        period,
        product
      });
    })();
  }, [period]);

  return current;
};
