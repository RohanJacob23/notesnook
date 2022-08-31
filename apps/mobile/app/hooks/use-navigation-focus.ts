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

import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RefObject, useCallback, useEffect, useRef, useState } from "react";

type NavigationFocus = {
  onFocus?: (prev: RefObject<boolean>) => boolean;
  onBlur?: (prev: RefObject<boolean>) => boolean;
  delay?: number;
  focusOnInit?: boolean;
};

export const useNavigationFocus = (
  navigation: NativeStackNavigationProp<Record<string, object | undefined>>,
  { onFocus, onBlur, delay, focusOnInit = true }: NavigationFocus
) => {
  const [isFocused, setFocused] = useState(focusOnInit);
  const prev = useRef(false);
  const isBlurred = useRef(false);

  const _onFocus = useCallback(() => {
    setTimeout(
      () => {
        const shouldFocus = onFocus ? onFocus(prev) : true;
        if (shouldFocus) {
          setFocused(true);
          prev.current = true;
        }
        isBlurred.current = false;
      },
      isBlurred.current ? 0 : delay || 300
    );
  }, [delay, onFocus]);

  const _onBlur = useCallback(() => {
    isBlurred.current = true;
    setTimeout(() => {
      const shouldBlur = onBlur ? onBlur(prev) : true;
      if (shouldBlur) {
        prev.current = false;
        setFocused(false);
      }
    }, delay || 300);
  }, [delay, onBlur]);

  useEffect(() => {
    if (!navigation) return;
    const subs = [
      navigation.addListener("focus", _onFocus),
      navigation.addListener("blur", _onBlur)
    ];
    return () => {
      subs.forEach((sub) => sub());
    };
  }, [_onBlur, _onFocus, navigation]);

  return isFocused;
};
