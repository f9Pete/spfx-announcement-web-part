import { SPHttpClient } from '@microsoft/sp-http';
import { Version } from '@microsoft/sp-core-library';
import {
  IPropertyPaneConfiguration,
  PropertyPaneTextField
} from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import styles from './CompanyAnnouncementsWebPart.module.scss';
import * as strings from 'CompanyAnnouncementsWebPartStrings';

export interface ICompanyAnnouncementsWebPartProps {
  description: string;
}

export default class CompanyAnnouncementsWebPart extends BaseClientSideWebPart<ICompanyAnnouncementsWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public render(): void {
    this.context.spHttpClient
  .get(`${this.context.pageContext.web.absoluteUrl}/_api/web/lists/getByTitle('Announcements')/items?$select=Title,Description,Important,Image`,
    SPHttpClient.configurations.v1,
    {
      headers: {
        'accept': 'application/json;odata.metadata=none'
      }
    })
  .then(response => response.json())
  .then(announcements => {
    const announcementsHtml = announcements.value.map((announcement: { Important: any; Title: any; Description: any; Image: any;}) =>
      `<dt${announcement.Important ?
        ` class="${styles.important}"` : ''}>${announcement.Title}</dt>

      <dd>${announcement.Description}</dd>
     `);
    
    this.domElement.innerHTML = `
    <div class="${styles.companyAnnouncements}">
      <div class="${styles.container}">
        <div class="${styles.title}">Announcements</div>
        <dl>
          ${announcementsHtml.join('')}
        </dl>
      </div>
    </div>
    `;
  })
  .catch(error => this.context.statusRenderer.renderError(this.domElement, error));
  }

  protected onInit(): Promise<void> {
    this._environmentMessage = this._getEnvironmentMessage();

    return super.onInit();
  }



  private _getEnvironmentMessage(): string {
    if (!!this.context.sdks.microsoftTeams) { // running in Teams
      return this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
    }

    return this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment;
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const {
      semanticColors
    } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }

  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: [
            {
              groupName: strings.BasicGroupName, 
              groupFields: [
                PropertyPaneTextField('description', {
                  label: strings.DescriptionFieldLabel
                })
              ]
            }
          ]
        }
      ]
    };
  }
}
